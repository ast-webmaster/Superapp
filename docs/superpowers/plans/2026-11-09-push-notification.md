# Push Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the backend sends a PriceApproval email, the recipient's Android phone gets a push; tapping it opens that document, and the Inbox refreshes.

**Architecture:** The backend stores each phone's Expo push token (`device_tokens`). `PriceApprovalJob` calls `PushNotifier::notify()` right after `Mail::send()`, which queues `SendPushNotificationJob` (Expo Push API) and, 15 minutes later, `CheckPushReceiptsJob` (prunes dead tokens). The app registers its token while signed in, invalidates the Inbox when a push arrives, and routes a tap through `ModuleManifest.detailRoute`.

**Tech Stack:** Laravel 13 / PHP 8.3 / Sanctum / MySQL (backend repo `C:\Users\Web.Developer\Laragon\digitalapproval`, branch `DEV`); Expo SDK 58, `expo-notifications`, `expo-dev-client`, Expo Router, TanStack Query, zustand, Jest (app repo `C:\Users\Web.Developer\Laragon\Superapp`, branch `master`).

**Spec:** `docs/superpowers/specs/2026-11-09-push-notification-design.md` (section "Keputusan: push dikirim setelah email terkirim, dipanggil eksplisit dari job"). Read `AGENTS.md` first: Expo APIs change per SDK, and `docs/data-management.md` governs data refresh.

## Global Constraints

- Android only for now. Code must be platform-agnostic: `platform` is stored as `android|ios` so iOS later needs only credentials and a build.
- Push goes out **only after** `Mail::send` returned. If `Mail::send` throws, no push is dispatched.
- `PushNotifier::notify()` **never throws**. An exception inside the email job would retry it and send the email twice.
- Delivery uses the Expo Push API `POST https://exp.host/--/api/v2/push/send`, at most 100 messages per request; receipts via `POST https://exp.host/--/api/v2/push/getReceipts` about 15 minutes later.
- Push payload `data` is exactly `{ "module": "<manifest slug>", "doc_uuid": "<uuid>" }`. `module` is the slug used by `ApiNotificationController::MODULES` and the app manifest id (`price-approval`).
- Only users with status `ACTIVE` (`User::scopeActive`) receive pushes. Recipients are matched by `users.email` (unique).
- A push token belongs to a device, not a user: registering a token that exists moves it to the current user.
- Logging out deletes the device tokens registered with that access token.
- Android channel id is `default`. Expo's drop-down alert needs the channel created before the token is requested.
- Remote push does not work in Expo Go on Android (SDK 53+): a development build is required.
- App rules from `AGENTS.md`: `npx expo install` for packages, kebab-case component/hook file names, camelCase for api/store/type files, module code only imported through `@/modules/<Name>`, `core` imports nothing else in `src`, `import/no-cycle` is on. Run `npm run lint`, `npm run typecheck`, `npm test` before declaring done.
- Backend tests hit real MySQL (`astrindo_superapp_test`, wrapped in a rolled-back transaction, see `tests/Feature/ApiNotificationTest.php` for `setUp`, `user()`, `asUser()`). The test database must be migrated: `php artisan migrate --env=testing`. `phpunit.xml` sets `QUEUE_CONNECTION=sync` and `MAIL_MAILER=array`.
- Out of scope: iOS credentials, notification preferences, modules other than PriceApproval, a notification icon asset.

## Review Focus

- Same phone, second user signs in after the first signed out: the token must now belong to the second user only (Task 1 test).
- A 401 forced sign-out (token revoked or expired) cannot call the server: stale tokens are removed by logout/receipts/re-registration, never by the app (accepted; covered by Task 1 logout test and Task 2 receipts test).
- Rejection remarks can be very long or contain user text: the push body is truncated so the payload stays far below Expo's 4 KiB limit (Task 3 test).
- Recipient is a NON-ACTIVE user, an unknown email, or a user with zero tokens: no HTTP call, no exception (Task 3 test).
- Expo is down (HTTP 5xx) or returns a ticket error: 5xx makes the queued job fail so the queue retries it; a ticket `DeviceNotRegistered` deletes that token only (Task 3 test).
- Tap arrives on cold start before the session is restored, or while signed out: the app must not navigate until authenticated, and must never navigate for a notification received while signed out (Task 6 test).
- Notification with unknown `module`, missing `doc_uuid`, or malformed `data`: ignored without crashing (Task 6 test).
- User denies the notification permission: no token registered, no error shown, app works normally (Task 5 test).

---

## Task 1: Device token storage, endpoints and logout cleanup (backend)

**Files:**
- Create: `database/migrations/2026_11_10_000000_create_device_tokens_table.php`
- Create: `app/Models/DeviceToken.php`
- Create: `app/Http/Controllers/ApiDeviceTokenController.php`
- Modify: `app/Models/User.php` (add `deviceTokens(): HasMany`)
- Modify: `routes/api.php`
- Modify: `app/Http/Controllers/ApiAuthController.php` (`logout`, line 77)
- Modify: `Modules/ApiDocumentation/Resources/data/catalog.php` (two entries after the `/api/v1/notifications` entry, same shape)
- Test: `tests/Feature/ApiDeviceTokenTest.php`

**Interfaces:**
- Produces: table `device_tokens` (`id`, `user_id` FK users cascadeOnDelete, `token` string(255) unique, `platform` string(10), `access_token_id` nullable unsignedBigInteger indexed, `last_seen_at` timestamp, timestamps); `App\Models\DeviceToken` (fillable `user_id, token, platform, access_token_id, last_seen_at`); `User::deviceTokens()`.
- Produces: `POST /api/v1/me/device-tokens` body `{token, platform}` -> 200 envelope `data: null`; `DELETE /api/v1/me/device-tokens` body `{token}` -> 200. Both under `auth:sanctum`; POST also `user.active`; DELETE without `user.active` (like logout).
- Validation: `token` required, regex `^Expo(nent)?PushToken\[.+\]$`, max 255; `platform` required, `in:android,ios`. Invalid -> 422 (same style as `ApiNotificationController`).

- [ ] **Step 1: Write the failing tests** in `ApiDeviceTokenTest` (copy the `setUp/tearDown/user()/asUser()` pattern):
  - `test_tanpa_token_ditolak_401` (POST and DELETE).
  - `test_mendaftarkan_token_membuat_baris_milik_user_dan_access_token_yang_dipakai`: assert row `user_id`, `platform`, `access_token_id` equals the current access token id, `last_seen_at` set.
  - `test_token_yang_sama_didaftarkan_dua_kali_tetap_satu_baris`.
  - `test_token_yang_sama_didaftarkan_user_lain_pindah_ke_user_itu`: one row, `user_id` is the second user.
  - `test_token_atau_platform_tidak_valid_ditolak_422` (`abc`, `platform=web`).
  - `test_user_nonaktif_ditolak_403_saat_mendaftar`.
  - `test_hapus_hanya_token_milik_sendiri`: user B DELETE with user A's token leaves A's row; user A DELETE removes it; both answer 200.
  - `test_logout_menghapus_token_perangkat_itu_saja`: two access tokens for one user each with a device token; logout with the first deletes only the first's device token.
- [ ] **Step 2: Run** `php artisan test --filter=ApiDeviceTokenTest` -> FAIL (table/route missing).
- [ ] **Step 3: Implement** migration, model, relation, controller (`store` = `DeviceToken::updateOrCreate(['token'=>...], [...])` with `access_token_id = $request->user()->currentAccessToken()->id`; `destroy` deletes `where user_id = me and token = ...`), routes named `api.me.device-tokens.store|destroy`, and in `logout` delete `DeviceToken::where('access_token_id', $token->id)` before deleting the access token. Add the two catalog entries in Indonesian like the neighbours.
- [ ] **Step 4: Run** `php artisan migrate --env=testing` then the filter -> PASS. Also run `php artisan test --filter=ApiLoginTest` and `ApiNotificationTest` -> still PASS.
- [ ] **Step 5: Commit** in the backend repo: `feat(api): register and remove device push tokens`.

## Task 2: Receipt check job (backend)

**Files:**
- Create: `app/Jobs/CheckPushReceiptsJob.php`
- Modify: `config/services.php` (add `'expo' => ['access_token' => env('EXPO_ACCESS_TOKEN')]`)
- Test: `tests/Feature/PushReceiptsTest.php`

**Interfaces:**
- Produces: `CheckPushReceiptsJob::__construct(array $tokensByReceiptId)` where keys are Expo receipt ids and values are the push token strings. `handle(): void`.
- Produces: config key `services.expo.access_token`; when non-empty, every Expo request (this job and Task 3) sends header `Authorization: Bearer <token>`.

- [ ] **Step 1: Write the failing tests** with `Http::fake`:
  - `test_receipt_DeviceNotRegistered_menghapus_token_itu_saja`: two tokens; fake `getReceipts` returns `data: {r1: {status: error, details: {error: DeviceNotRegistered}}, r2: {status: ok}}`; assert only token for `r1` is gone.
  - `test_receipt_error_lain_tidak_menghapus_token` (`MessageRateExceeded`).
  - `test_receipt_yang_belum_ada_diabaikan` (id missing from `data`).
  - `test_request_membawa_bearer_bila_access_token_diset`.
  - `test_respons_5xx_membuat_job_gagal_agar_di_retry`.
- [ ] **Step 2: Run** `php artisan test --filter=PushReceiptsTest` -> FAIL.
- [ ] **Step 3: Implement** the job as `ShouldQueue` with `$tries = 3`, `backoff` 60s; send at most 1000 ids per request (`array_chunk`); on `HTTP >= 500` call `->throw()`.
- [ ] **Step 4: Run** the filter -> PASS.
- [ ] **Step 5: Commit**: `feat(push): check Expo receipts and prune dead tokens`.

## Task 3: Send job and `PushNotifier` (backend)

**Files:**
- Create: `app/Jobs/SendPushNotificationJob.php`
- Create: `app/Services/PushNotifier.php`
- Test: `tests/Feature/PushNotifierTest.php`

**Interfaces:**
- Consumes: `DeviceToken`, `User::scopeActive`, `CheckPushReceiptsJob(array $tokensByReceiptId)`, `services.expo.access_token`.
- Produces: `App\Services\PushNotifier::notify(string|array $emails, string $module, string $docUuid, string $title, string $body): void` (static). Queues `SendPushNotificationJob` with the same five arguments (`$emails` always an array). Catches `Throwable`, calls `report($e)`, returns.
- Produces: `SendPushNotificationJob::handle(): void`. For each device token of ACTIVE users whose `email` is in `$emails`, builds a message `{to, title, body (Str::limit 140), data: {module, doc_uuid}, channelId: 'default', priority: 'high'}`; posts in chunks of 100; for each `status: error` ticket with `details.error === 'DeviceNotRegistered'` deletes that token; dispatches `CheckPushReceiptsJob` (`->delay(now()->addMinutes(15))`) with `receiptId => token` for the `ok` tickets. `$tries = 3`, 5xx throws.

- [ ] **Step 1: Write the failing tests** with `Http::fake` + `Bus::fake([CheckPushReceiptsJob::class])`:
  - `test_mengirim_ke_semua_token_user_aktif_dengan_payload_deep_link`: user with 2 tokens; assert one request to `https://exp.host/--/api/v2/push/send` whose body has two messages, each `data == ['module'=>'price-approval','doc_uuid'=>$uuid]`, `channelId == 'default'`, `title` and `body` set.
  - `test_email_tidak_dikenal_user_nonaktif_atau_tanpa_token_tidak_memanggil_expo`: `Http::assertNothingSent()`.
  - `test_body_dipotong_140_karakter`.
  - `test_lebih_dari_100_token_dikirim_dalam_beberapa_request` (e.g. 101 tokens -> 2 requests).
  - `test_ticket_DeviceNotRegistered_menghapus_token_dan_ticket_ok_dijadwalkan_cek_receipt`: `Bus::assertDispatched(CheckPushReceiptsJob::class, fn ($j) => ...)` with the delay of 15 minutes.
  - `test_respons_5xx_membuat_job_gagal` (call `handle()`, expect `RequestException`).
  - `test_notify_menelan_exception_dan_tidak_melempar`: make the queue throw (swap the `queue` binding for a mock whose `push` throws), call `notify()`, assert no exception and `Log`/`report` received it.
  - `test_notify_meneruskan_email_array_dan_string_sama`.
- [ ] **Step 2: Run** `php artisan test --filter=PushNotifierTest` -> FAIL.
- [ ] **Step 3: Implement** both classes. Match recipients with `whereIn('email', ...)` on `users` joined via `DeviceToken::whereHas('user', fn ($q) => $q->active()->whereIn('email', $emails))`; set Bearer header like Task 2 (extract nothing shared unless a third copy appears).
- [ ] **Step 4: Run** the filter, then `--filter=PushReceiptsTest` -> PASS.
- [ ] **Step 5: Commit**: `feat(push): send Expo push notifications from a queued job`.

## Task 4: Send the push after the PriceApproval email (backend)

**Files:**
- Modify: `Modules/PriceApproval/Jobs/PriceApprovalJob.php` (after line 110 `Mail::to(...)->send(...)`)
- Test: `tests/Feature/PriceApprovalPushTest.php`

**Interfaces:**
- Consumes: `PushNotifier::notify($emails, 'price-approval', $header->pa_uuid, $title, $description)`.
- The job already has `$header`, `$title`, `$description` and `$this->data['email']`.

- [ ] **Step 1: Write the failing tests** (create a `price_approval_headers` row like `ApiNotificationTest::header()`, with `status` set per case; `Mail::fake()`, `Bus::fake([SendPushNotificationJob::class])`):
  - `test_push_dikirim_setelah_email_dengan_judul_deskripsi_dan_uuid_dokumen`: run `(new PriceApprovalJob(['pa_no'=>..., 'email'=>...]))->handle()`; `Mail::assertSent(NotificationMail::class)`; `Bus::assertDispatched(SendPushNotificationJob::class)` with `module 'price-approval'`, the header's `pa_uuid`, title `AWAITS YOUR APPROVAL` for status `AWAITING`.
  - `test_push_tidak_dikirim_bila_email_gagal`: make `Mail::to` throw; assert the exception propagates and `Bus::assertNotDispatched(SendPushNotificationJob::class)`.
- [ ] **Step 2: Run** `php artisan test --filter=PriceApprovalPushTest` -> FAIL.
- [ ] **Step 3: Implement**: add one `PushNotifier::notify(...)` call as the last statement of `handle()`.
- [ ] **Step 4: Run** the filter, then the full `php artisan test` for the files touched by Tasks 1-4 -> PASS.
- [ ] **Step 5: Commit**: `feat(price-approval): push notification after the email`.

## Task 5: Register the push token (app, `core/notifications`)

**Files:**
- Modify: `package.json` / `package-lock.json` via `npx expo install expo-notifications expo-dev-client`
- Modify: `app.json` (plugins: add `["expo-notifications", { "defaultChannel": "default" }]`; `expo-dev-client` needs no plugin entry)
- Create: `src/core/notifications/pushApi.ts`, `src/core/notifications/register-for-push.ts`, `src/core/notifications/index.ts`
- Test: `src/core/notifications/register-for-push.test.ts`

**Interfaces:**
- Produces: `pushApi.register(token: string, platform: 'android' | 'ios'): Promise<void>` (`POST /me/device-tokens` with `{token, platform}`).
- Produces: `registerForPushNotifications(): Promise<void>` exported from `@/core/notifications`. Never throws. Steps: return on web or when `!Device.isDevice`; on Android create channel `default` (`name: 'General'`, `importance: AndroidImportance.HIGH`) before anything else; `getPermissionsAsync`, then `requestPermissionsAsync` if not granted; return if still not granted; `projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId`, return if missing; `getExpoPushTokenAsync({ projectId })`; `pushApi.register(data, Platform.OS)`.
- Re-read `https://docs.expo.dev/versions/v58.0.0/sdk/notifications/` before coding: SDK 58 deprecates `shouldShowAlert` (use `shouldShowBanner`/`shouldShowList`).

- [ ] **Step 1: Write the failing tests** (mock `expo-notifications`, `expo-device`, `expo-constants`, `@/core/api`): 
  - `registers the token with the platform once permission is granted` (assert `apiClient.post('/me/device-tokens', { token: 'ExponentPushToken[abc]', platform: 'android' })`).
  - `creates the Android channel before asking for the token` (call order).
  - `asks for permission when not yet granted and stops when denied` (no `getExpoPushTokenAsync`, no API call).
  - `does nothing on a simulator` (`Device.isDevice = false`).
  - `swallows errors from the token request and the API` (resolves, no throw).
- [ ] **Step 2: Run** `npx jest src/core/notifications` -> FAIL.
- [ ] **Step 3: Install and implement** as in Interfaces. Install with `npx expo install`, never `npm i`.
- [ ] **Step 4: Run** `npx jest src/core/notifications`, `npm run typecheck`, `npm run lint` -> PASS.
- [ ] **Step 5: Commit**: `feat(notifications): register the Expo push token`.

## Task 6: Receive, route and register while signed in (app shell)

**Files:**
- Create: `src/navigation/notification-route.ts` and `src/navigation/notification-route.test.ts`
- Create: `src/navigation/use-push-notifications.ts` and `src/navigation/use-push-notifications.test.tsx`
- Modify: `src/navigation/root-navigator.tsx` (call the hook once, next to `restore`)
- Modify: `src/modules/Inbox/index.ts` (export `inboxKeys`)

**Interfaces:**
- Consumes: `registerForPushNotifications` (Task 5), `moduleManifests` from `src/navigation/registry.ts`, `useAuthStatus`, `queryClient` via `useQueryClient`, `inboxKeys` from `@/modules/Inbox`.
- Produces: `resolveNotificationRoute(data: unknown, manifests: readonly ModuleManifest[]): string | null` — returns `manifest.detailRoute(doc_uuid)` when `data.module` matches a manifest id that has `detailRoute` and `data.doc_uuid` is a non-empty string; otherwise `null`.
- Produces: `usePushNotifications(): void`, behaviour:
  - Module level: `Notifications.setNotificationHandler` returning `{ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }`.
  - While status is `authenticated`: call `registerForPushNotifications()` once per sign-in.
  - While authenticated: `addNotificationReceivedListener` invalidates `inboxKeys.all`; removed on cleanup.
  - Tap: `useLastNotificationResponse()`; ignore `undefined`/`null` and non-default actions; wait while status is `restoring`; if status is `unauthenticated` mark that response handled and do nothing; if authenticated, navigate with `router.push(route)` once per `response.notification.request.identifier` (also invalidate the Inbox).

- [ ] **Step 1: Write the failing tests.** `notification-route.test.ts`: price-approval + uuid -> `/price-approval/<uuid>`; unknown module -> `null`; missing/empty/non-string `doc_uuid` -> `null`; `data` undefined or not an object -> `null`; manifest without `detailRoute` -> `null`. `use-push-notifications.test.tsx` (mock `expo-notifications`, `expo-router`, `@/core/auth`, `@/core/notifications`; use `renderHook` with a `QueryClientProvider`):
  - `registers the push token once when authenticated and not while restoring or signed out`.
  - `invalidates the inbox when a notification arrives`.
  - `opens the document when a notification is tapped while authenticated` (`router.push('/price-approval/<uuid>')` once, even after re-render).
  - `waits for the session before opening a document from a cold start` (status `restoring` -> no push; then `authenticated` -> push once).
  - `ignores a tap while signed out and does not replay it after the next sign-in`.
  - `ignores a tap with an unknown module`.
- [ ] **Step 2: Run** `npx jest src/navigation` -> FAIL.
- [ ] **Step 3: Implement** the two files, mount the hook in `RootNavigator` (hook must run before the `status === 'restoring'` early return), and export `inboxKeys` from the Inbox index.
- [ ] **Step 4: Run** `npx jest src/navigation`, then `npm test`, `npm run typecheck`, `npm run lint` -> PASS.
- [ ] **Step 5: Commit**: `feat(notifications): open documents and refresh the inbox from pushes`.

## Task 7: Document the pattern (app)

**Files:**
- Modify: `docs/data-management.md` (section "Inbox": add that a received push invalidates `inboxKeys.all`, a tap opens `detailRoute`, and registration happens in `usePushNotifications`)
- Modify: `docs/superpowers/specs/2026-11-09-push-notification-design.md` (set status to implemented; list what was built)

- [ ] **Step 1: Edit** both documents.
- [ ] **Step 2: Run** `npm run lint`, `npm run typecheck`, `npm test` -> PASS.
- [ ] **Step 3: Commit**: `docs: describe push notifications in data management`.

## Task 8: End-to-end check on a real phone (manual, needs the user)

Prerequisites: queue worker running on the backend (`php artisan queue:work`), backend reachable from the phone, `google-services.json` and the FCM V1 key already in place.

- [ ] **Step 1:** In the app repo run `npx eas-cli build --profile development --platform android`; install the APK on a physical Android phone.
- [ ] **Step 2:** `npx expo start --dev-client`, open the app, sign in, accept the notification permission. Verify a row appears in `device_tokens` for that user.
- [ ] **Step 3:** From the Expo tool `https://expo.dev/notifications`, send a test push to that token with `data: {"module":"price-approval","doc_uuid":"<a real pa_uuid>"}`; tap it from the background and from a killed app: the document opens.
- [ ] **Step 4:** Trigger a real PriceApproval email to that user (submit or approve a document on the web). Verify email arrives, then the push, and that the Inbox badge updates without leaving the screen.
- [ ] **Step 5:** Sign out in the app; verify the user's `device_tokens` row is gone and a new PriceApproval email no longer produces a push to that phone.
- [ ] **Step 6:** After ~15 minutes check `jobs`/`failed_jobs` for `CheckPushReceiptsJob`; none failed.
