# Data management

How this app reads, caches, keeps, syncs and changes server data. **Read this before a module fetches or changes data.** It is the data counterpart of [ui-foundation.md](ui-foundation.md). `PriceApproval` is the reference implementation: copy its shape for a new module.

## The rule

**The Laravel backend is the single source of truth.** The app holds a copy for display and speed, nothing more.

- A status, total or permission is what the server last said. The app never writes a guessed value into the cache. There are no optimistic updates for business data.
- An action counts as done only when the server answers with success. The screen then shows the server's copy from that response.
- HTTP 200 is not the same as a successful business operation. Mobile endpoints must answer a refused action with a 4xx code (see [Backend contract](#backend-contract)), never `200 {result: false}` like the legacy web endpoints.

## Who owns what

| Data                                             | Lives in                                             | Persisted to disk | Notes                                                                                                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access token, expiry                             | `core/auth` → `core/storage` (SecureStore)           | Yes, encrypted    | Never in zustand state, never in the query cache. Web falls back to localStorage, which is for development only                                                                             |
| Session user, roles, permissions                 | `core/auth` zustand store                            | No                | Reloaded from `/me` at startup and refreshed while signed in. See [Session refresh](#session-refresh)                                                                                       |
| Favorite apps (module ids, in order)             | `navigation/favorite-apps-store.ts` → `core/storage` | Yes, per user     | A device preference, not server data: a short list under `favorite_apps_<userId>`. Read after sign-in, dropped on sign-out. Ids of apps the user may no longer open are hidden, not deleted |
| Server data (lists, details, counts)             | TanStack Query cache                                 | **No**            | Memory only. See [Persistence](#persistence)                                                                                                                                                |
| UI state (filter, tab, search text, draft input) | A small zustand store in the module, or `useState`   | No                | Never a copy of server data                                                                                                                                                                 |

## The pieces

| File                                   | Owns                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/core/api/apiClient.ts`            | The only HTTP client. Bearer token, `/v1` prefix, JSON, 20 s timeout, error mapping to `AppError`            |
| `src/core/errors/appError.ts`          | `AppError` and its `code`; `isRetryable`                                                                     |
| `src/providers/query-client.ts`        | The `QueryClient`: retry policy, mutation defaults, app focus and network wiring, cache clearing on sign-out |
| `src/modules/<Name>/api/<name>Keys.ts` | The module's query keys                                                                                      |
| `src/modules/<Name>/api/<name>Api.ts`  | The module's endpoints and wire types                                                                        |
| `src/modules/<Name>/hooks/`            | One hook per query or mutation                                                                               |

### Error codes

`apiClient` throws only `AppError`. A cancelled request rethrows the raw abort error, so React Query can see it as a cancellation.

| `code`         | From                                  | Retried by queries | Show                                                                                                     |
| -------------- | ------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `network`      | No response                           | Yes                | Offline or retry state                                                                                   |
| `timeout`      | No answer within `REQUEST_TIMEOUT_MS` | Yes                | Same as `network`                                                                                        |
| `server`       | 5xx                                   | Yes                | "Try again"                                                                                              |
| `unauthorized` | 401 with a token                      | No                 | Session cleared, so the user lands on sign-in automatically. Also what an inactive account gets          |
| `forbidden`    | 403                                   | No                 | No access. Hide the entry via the manifest `permission`. A 403 with a token also reloads the permissions |
| `not_found`    | 404                                   | No                 | "Not found". Records the user may not see also answer 404                                                |
| `conflict`     | 409                                   | No                 | "This changed, review the latest version", and refetch                                                   |
| `validation`   | 422                                   | No                 | `fieldErrors` on the fields                                                                              |
| `rate_limited` | 429                                   | No                 | Message                                                                                                  |

## Query keys

Every module has one key factory. Its first segment is the manifest `id`, so two modules can never collide:

```ts
export const priceApprovalKeys = {
  all: ['price-approval'] as const,
  lists: () => [...priceApprovalKeys.all, 'list'] as const,
  list: (filters: PriceApprovalListFilters, search: string) =>
    [...priceApprovalKeys.lists(), filters, search] as const,
  details: () => [...priceApprovalKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...priceApprovalKeys.details(), uuid] as const,
};
```

- Never write a key inline in a hook. Never use another module's keys: to refresh another module after an action, export a function from that module's `index.ts`.
- Invalidate the narrowest family that changed (`lists()`, `detail(id)`). `queryClient.invalidateQueries()` with no key is not allowed.

## Reading

- `useQuery` / `useInfiniteQuery` with the key factory and `signal` passed to the api function, so leaving a screen cancels its request.
- Default `staleTime` is 60 s. Set `staleTime: 0` on a detail whose actions depend on its current status, so opening the screen always asks again while the cached copy shows.
- Search text goes to the server (`search` query param) through the key, debounced with `useDebouncedValue`, with `placeholderData: keepPreviousData` so rows stay while the next result loads. Never filter loaded pages on the client: paging makes that incomplete.
- Filters go to the server the same way. `PriceApprovalListFilters` (status, tier, date range, grand total) sits in the zustand filter store, is part of the list key, and each field is a query param (`status`, `last_updated_tier`, `date_from`/`date_to`, `min_total`/`max_total`). The filter sheet edits a draft and writes the store only on Apply.
- Paged lists that are sorted newest first de-duplicate rows by id in `select`, because a new record shifts rows into the next page.
- Keep `status` as `string` in the types and show unknown values as they are. The backend adds statuses without warning.

### When data refreshes

| Moment                        | Mechanism                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Screen opens                  | A stale query refetches on mount                                             |
| App returns to the foreground | `focusManager`, wired to `AppState` (native)                                 |
| Connection returns            | `onlineManager`, wired to `expo-network` (native), and re-read on foreground |
| After an action               | The mutation's `onSuccess` / `onError`                                       |
| User pulls down               | `refetch()` from `RefreshControl` / `FlatList onRefresh`                     |

There is no polling.

### Session refresh

An account deactivated or a permission changed on the web reaches the app without a restart. `useAuthStore.refreshSession()` reloads `/me` and replaces the user, roles and permissions:

| Moment                          | Call                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| App returns to the foreground   | `useSessionRefresh` (`navigation/`), on React Query's focus signal |
| A signed-in request answers 403 | `apiClient`'s forbidden handler, `{ force: true }`                 |
| User pulls down on the Apps tab | `AppsScreen`, `{ force: true }`                                    |

- Without `force`, a refresh is skipped within `SESSION_REFRESH_INTERVAL_MS` (60 s) of the last load (sign-in, startup or refresh). Overlapping calls share one request. It costs the server one small request per foreground at most, not a poll.
- `/me` answering 401 (token revoked, account inactive) or 403 ends the session. Offline, timeout and 5xx keep it, and the next focus tries again.
- New permissions show a module on Home and Apps (`useAvailableModules`). Lost permissions close it: `AppStack` (`navigation/app-stack.tsx`) wraps each module's route in `Stack.Protected` with the manifest `permission`, so an open module screen goes home and links into it (push, inbox) are refused.
- The server is still the guard. The app only stops offering what the server would refuse. Push notifications (see Inbox) call the same module invalidation functions and change nothing else. A WebSocket, if added, would do the same.

## Writing (actions)

The pattern lives in `PriceApproval/hooks/use-price-approval-action.ts` and `components/approval-actions.tsx`.

1. **Show only what the server allows.** The detail carries `allowed_actions`. The app renders those buttons and never decides permissions itself.
2. **Validate input on the device first** (for example "a reason is required to reject"), so an obviously bad request is never sent. The server validates again.
3. **Confirm** consequential actions (native `Alert.alert`, `window.confirm` on web).
4. **Prevent double submission.** Buttons are disabled while `isPending`, and the handler returns early when pending. The server is the real guard: a repeat request gets 409.
5. **Send a concurrency reference.** The request includes the `updated_at` of the record the user looked at. The server refuses it with 409 if the record changed since.
6. **Wait for the server.** No optimistic update.
7. **On success**, `setQueryData(detail(id), response)` with the server's copy, then invalidate the lists (not awaited).
8. **On error:**
   - `validation`: nothing changed. Show the field errors and refetch nothing.
   - `conflict`: someone else acted first. Refetch the detail and lists, and say the record changed.
   - `network`, `timeout`, `server`: **the outcome is unknown**, because the request may have gone through. Refetch, and tell the user to check the status before trying again.
9. **Show the result from the server's status** ("Saved. Status is now Finished"), not from the button that was pressed.

Mutation defaults in `query-client.ts` apply to every module:

- `retry: false`: a write is never repeated automatically.
- `networkMode: 'always'`: an offline action fails at once. The default (`'online'`) would hold it and send it when the network returns, which is an approval queue the user never confirmed.

## Offline

- Cached data stays visible with an `Alert tone="warning"`: "You are offline. Showing data from 10:42." The time comes from `dataUpdatedAt` (`formatSyncedAt`).
- With no cached data, show the "You are offline" `EmptyState` with retry (the query's `fetchStatus === 'paused'`).
- Actions are disabled offline (`useIsOnline()`), with a caption saying why.
- No action is ever queued for later.

## Persistence

Server data is **not** written to disk. There is no AsyncStorage, no `persistQueryClient` and no SQLite. The reasons:

- Approval data is sensitive business data, and SecureStore is not built for large values.
- Offline actions are not allowed, so an offline copy only helps read-only browsing, and stale approval status is harmful.
- The memory cache already makes back-navigation and tab switches instant.

Revisit this only for a real offline-read requirement. If it comes, the policy is:

- persist list queries only (a key whitelist);
- add a `buster` made of the user id and the app version;
- set `maxAge` to 24 h;
- clear it on sign-out.

SQLite is for structured offline work, which no module has.

## User isolation (sign-out and account switch)

When the auth status leaves `authenticated` (sign-out, 401, deactivated account):

- `core/auth` drops the token from memory and SecureStore.
- `query-client.ts` calls `queryClient.clear()`, so the next user sees none of the previous user's data.
- Each module store holding user-specific UI state resets itself. Subscribe to `useAuthStore` in the store file (see `priceApprovalFilterStore.ts`).

## Profile

The signed-in user is `core/auth` state, so profile edits go through the auth store, not the query cache: `updateProfile({name, photo?})` and `changePassword(...)`. Both wait for the server. `updateProfile` replaces the session user with the server's copy, which carries the new `profile_photo_path` and `profile_photo_url`; the photo is not written to disk by the app (expo-image caches it, and a new upload gets a new path). Backend:

- `POST /v1/me/profile`, multipart (`name`, optional `photo`: jpg/png, up to 2 MB). Answers `{user}`. It is POST because PHP does not fill uploaded files on PUT. The app checks the 2 MB limit on the device first.
- `PUT /v1/me/password` (`current_password`, `password`, `password_confirmation`), throttled to 6 a minute. It signs out the user's other devices and keeps this one.

A wrong field answers 422 with `errors`, which the screens show on the fields. `apiClient` sends a `FormData` body as multipart and sets no `Content-Type`.

## Inbox

The Inbox is the user's rows in the backend `notifications` table (documents waiting for them), read from `GET /v1/notifications?module=<slug,slug>&per_page=&page=` with the usual envelope and `meta`. `module` is the manifest id; a slug the backend does not know yet is ignored. Each item has `title` and `subtitle` resolved from the document (null when it is gone). Query keys start with `inbox`. The tab badge is `meta.total` of a one-item list; screens refetch stale inbox queries when shown again (`useRefreshInboxOnFocus`). A module opts in on the server (`ApiNotificationController::MODULES`) and in its manifest (`detailRoute`, so a tap opens the document).

### Push notifications

The backend sends a push (Expo Push API, payload data `{ module, doc_uuid }`) right after it emails a document. The app side lives in `usePushNotifications` (`navigation/use-push-notifications.ts`, mounted in the root navigator):

- **Registration.** Once per sign-in it calls `registerForPushNotifications` (`core/notifications`), which asks permission and posts the Expo token to `POST /v1/me/device-tokens`. Best effort: it never throws and never blocks sign-in. The backend drops the token on logout or when Expo reports it dead.
- **Received while the app is open.** Invalidates `inboxKeys.all` (exported from `@/modules/Inbox`), so the badge and list refetch. This only happens while the app is in the foreground; a push that arrives in the background relies on the normal focus refetch.
- **Tapped.** Invalidates `inboxKeys.all`, then `resolveNotificationRoute` (`navigation/notification-route.ts`) finds the manifest whose `id` equals `module` and pushes its `detailRoute(doc_uuid)`. A tap is handled once per notification, including a cold start, and only after the session is known. A module without `detailRoute` just opens the app.
- **Adding a module to push.** Call `PushNotifier::notify()` in its backend email job and give its manifest a `detailRoute`.

## AI chat

The AI chat tab (`src/modules/AiChat`) talks to `v1/ai-chat` (`digitalapproval/Modules/AiChat`). It is reached from its own tab, so it has no manifest; `navigation/ai-chat-screen.tsx` shows it when `useCan()` passes `AI_CHAT_PERMISSIONS` (the backend's `AiChatConversationService::READ_PERMISSIONS`) and the coming-soon page otherwise. The server's `meta.suggestions` are shown on the newest answer only, while nothing is in flight, and tapping or sending one posts it as an ordinary message. By `meta.type`: `clarify` (the AI could not tell what was meant) lists them as radio options (`ClarifyChoices`); `denied` and `unanswerable` show them as chips labelled "Try asking:"; any other answer shows them as chips labelled "Follow-up questions" (`SuggestionChips`).

- **Keys:** `aiChatKeys.sessions()` (loaded only while the history sheet is open) and `aiChatKeys.messages(uuid)`.
- **Active chat and the message on its way are module state** (`store/aiChatStore.ts`, reset on sign-out), not the query cache. The in-flight message is shown as a bubble from that state and disappears once the server's history has it. It lives outside the screen so a send survives the screen going away.
- **Lazy session:** a new chat creates its session (`POST /sessions`) only when the first message is sent.
- **Send** waits for the AI, which can take minutes, so it gets `timeoutMs: 180_000`. On success the messages are refetched (awaited) and the session list invalidated. A 422 gives the message back with the server's reason. A timeout, lost connection or 5xx refetches the history; only if it has no new messages is the message offered back ("Edit and resend"). It is never resent automatically.
- **Progress polling** is the one exception to "There is no polling": while a send waits, `useChatProgress` asks `GET /progress/{trace_id}` every 700 ms for ten polls, then every 1800 ms, and stops when the send settles. Errors are ignored.
- **Files:** attachments (at most 3, 10 MB, images 5 MB, pdf/png/jpg/docx/xlsx/xls) are checked on the device first and sent as multipart `attachments[]`. Downloads and the Excel export go through `apiClient.getFile` and `shareFile`; the absolute `url` the server sends for an attachment is not used.
- **Voice** (`expo-speech-recognition`, needs a development build) turns speech into text on the device in `id-ID`; nothing is sent to the server until the user presses send.

## Stock Penjualan

The Stock Penjualan module (`src/modules/StockPenjualan`) is read-only and talks to `v1/stock-esales` (`digitalapproval/Modules/StockEsales`). Manifest `permission` is `read_stock_esales` or `read_all_stock_esales`, the same either-or the backend middleware uses.

- **The server picks the row shape.** `meta.view` is `sales` (holders of `read_stock_esales`: price, HQ, own office, in transit) or `all` (stock per office and a total). The api tags each row with `kind`, so a card follows the row, not a guess. The app never derives the view from permissions.
- **No exact HQ figure from 100 up.** The server sends `stock_hq: null` and `stock_hq_over_100: true`; the card shows "> 100". Do not try to recover the number.
- **Keys:** `stockPenjualanKeys.list(filters, search)` and `categories()` (loaded only while the filter sheet is open). Filters (category, stock type) sit in `store/stockPenjualanFilterStore.ts` and reset on sign-out. The stock type chips show only in the `all` view; the server ignores `type` in `sales`.
- **Search and category go to the server** (`search`, `category_code`), paged 15 at a time, rows de-duplicated by `product_code`.
- **Export** (`GET /export`) is an unfiltered `.xlsx` that the server picks by permission. It goes through `apiClient.getFile` and `shareFile`, from the toolbar actions menu. Nothing is cached.
- **Freshness:** `meta.last_updated_at` is the time of the last stock import, shown above the list as "Stock as of …". It is separate from the offline notice, which uses `dataUpdatedAt`.

## Purchase Request

The Purchase Request module (`src/modules/PurchaseRequest`) talks to `v1/purchase-request` (`digitalapproval/Modules/PurchaseRequest`). It follows `PriceApproval` (list, detail with `allowed_actions`, action, create, export). Manifest `permission` is `read_purchase_request`; the create button and the lookups need `create_purchase_request`.

- **Actions:** `approve`, `process` (purchasing admin's forward step), `revise`, `reject`. The server decides which the user may do. `revise` and `reject` need a reason of at most 191 characters, checked on the device first.
- **Receive:** the requester confirms goods on a `COMPLETED` request. The server marks each item with `can_receive` (requester only, item ordered and not received yet); when any item has it, the detail shows a "Receive" bar that opens `ReceiveSheet`: the items with a checkbox each (none ticked at first, "Select all" when there are two or more) and "Confirm receive". It goes to `POST /{uuid}/receive` with `{item_ids}` (JSON), not `/actions`, and sends no `updated_at`: partial receipts do not change the header, so the server re-checks every item under a lock and answers `409` for one already received (nothing changes, the detail reloads). The request becomes `RECEIVED` once every ordered item is received, and the response is the fresh detail.
- **Keys:** `purchaseRequestKeys.list(filters, search)`, `detail(uuid)` and `lookups()` (vendors, offices, items; each enabled only while its sheet is open). Filters (status, date range) sit in `store/purchaseRequestFilterStore.ts` and reset on sign-out. Search goes to the server.
- **Offices are not searched on the server.** `GET /offices` answers every office, so `useOfficeOptions` narrows them on the device. Vendors and items are server searches of at most 50 rows.
- **Create** (`/purchase-request/new`) has no draft on the server: the request is saved and submitted in one call, as multipart (`api/buildCreateForm.ts`). An item is a registered one (`item_code`) or a new name (`item_name`), never both. TRADE and EVENT items need a supporting document (10 MB); attachments are up to 10 files of 20 MB, each with a description. The same registered item cannot appear twice. The total is a preview (quantity times unit price); the server's figure wins. A 422 can carry a business reason (for example goods received late and not yet confirmed), which the screen shows as it is.
- **Files:** attachments and item documents are fetched with `apiClient.getFile` from `/{uuid}/attachments/{id}/download` and `/{uuid}/items/{id}/document` and handed to `shareFile`. The absolute `download_url` the server sends is not used.
- **Export** (`GET /export`) is an `.xlsx` of a date range of at most 31 days (the sheet allows 30), without drafts. Nothing is cached.
- **Inbox and push:** the module id is `purchase-request`, the slug the backend notifies with, and `detailRoute` opens the request.

## On Duty Request

The On Duty Request module (`src/modules/OnDutyRequest`) talks to `v1/on-duty-request` (`digitalapproval/Modules/OnDutyRequest`). One document has two stages under one `uuid`: the **request** (a business trip) and its **declaration** (the real costs after the trip). It follows `PurchaseRequest` for the list, detail, action and create parts. Manifest `permission` is the list of every permission the web pages accept; creating, resubmitting and the lookups need `create_on_duty_request`.

- **Status:** `AWAITING` → `APPROVED` → (requester sends the declaration) `AWAITING APPROVAL DECLARATION` → `DONE`, with `REVISE`, `REJECTED`, `CANCELED` and `REVISE DECLARATION` on the side. The list filter also takes `SUBMISSION` and `DECLARATION`. Statuses stay `string`; the app labels the ones it knows (`components/status.ts`).
- **Actions:** `approve`, `revise`, `reject`, `cancel`. The server picks the stage (request or declaration) and decides who may act. `revise` and `reject` need a reason of at most 1000 characters; `cancel` is the requester's and takes back the declaration while one is open (the request goes back to `APPROVED`). The detail also carries `can_resubmit` and `can_declare`, which show the requester's own button in `DetailActions`.
- **Keys:** `onDutyRequestKeys.list(filters, search)`, `detail(uuid)` and `lookups()` (`options()` and `destinations(type, search)`). Filters sit in `store/onDutyRequestFilterStore.ts` and reset on sign-out. Search goes to the server.
- **Lookups:** `GET /options` answers brands, expense kinds and the account's daily allowance per trip type, all at once; the expense picker narrows them on the device and shares that one query. `GET /destinations?type=` is a server search (cities for `DOMESTIC`, countries for `OVERSEAS`, at most 50). A trip type with no allowance (`null`) stops the form: the server would refuse the request.
- **Create** (`/on-duty-request/new`) saves and submits in one call, as multipart (`api/buildRequestForm.ts`): type, purpose, remarks, the letter of assignment (required, 10 MB), brands, optional cost sharing (percentages must add up to 100), destinations (dates must not overlap), costs, and attachments with a description each. The app previews the allowance (daily rate × days, both ends counted); the server's figure wins. A voucher expense is always sent as 0.
- **Resubmit** (`/on-duty-request/resubmit/{uuid}`) is the same form, started from the detail. The body **replaces** everything, so attachments are added again (files cannot be fetched back into the form), and the letter is optional (empty keeps the old one). Approval starts again from the first step. `409` means it is no longer in `REVISE`.
- **Declaration** (`/on-duty-request/declaration/{uuid}`, `api/buildDeclarationForm.ts`): every cost row needs its real amount and a receipt (a new file, or the one already stored). Rows cannot be added or removed, and a cost's `id` changes with every send, so the form is always built from the latest detail. A destination goes up only when its days changed; the server recalculates the allowance.
- **Files:** attachments, the letter and receipts come from `apiClient.getFile` and go to `shareFile`. The letter and receipts have no file name, so `hooks/sniff-extension.ts` reads the type from the bytes.
- **Inbox and push:** the module id is `on-duty-request`, the slug the backend notifies with (`data.doc_uuid` is the request's `uuid`, for declaration mails too), and `detailRoute` opens the document.

## Meeting Room

The Meeting Room module (`src/modules/MeetingRoom`) talks to `v1/meeting-room` (`digitalapproval/Modules/MeetingRoom`). It books half-hour slots of a room for one day. Manifest `permission` is `create_meeting_room`; the backend also limits it to some offices (`403` otherwise, shown by `QueryStatus` as "No access"). There is no paging, no filter store and no sign-out cleanup: the screen's day is `useState`.

- **Rooms:** `GET /?date=` answers every room with its active bookings that day (cancelled ones are left out), and `meta.slots`, the slots a booking may use. One cache entry per day: `meetingRoomKeys.list(date)`. `staleTime: 0`, because whether a slot is free changes under the user's feet; the cached day shows while it refetches. No `keepPreviousData`: the old day's bookings under the new date would mislead.
- **Detail:** `GET /{id}` (numeric id, not a uuid) answers the booking with `status` (`BOOKED`, `ENDED`, `CANCELLED`), attendees, and `can_cancel`, which decides the cancel button. `staleTime: 0`.
- **Create** (`/meeting-room/new?room=&date=`): JSON, one room, one day, and one unbroken run of slots (`create/slots.ts` grows or shrinks the run on each tap and disables taken slots from the day's bookings). The form validates first (`create/draft.ts`), then the server decides: a slot that is taken, past or not consecutive is `422` on `time_slot`, and the form clears the slots. Any error refetches the day. `special_request` is required only for the room named `LANTAI 5`, the same name check the backend makes. Attendees are emails (lower-cased, no duplicates); the server drops the organizer's own.
- **Cancel:** `POST /{id}/cancel` with `remarks` of 6 to 1000 characters (asked in the confirm dialog). The server picks who may (organizer or `cancel_meeting_room`) and answers `409` for a booking already cancelled or ended. On success the detail shows the server's copy and the days are invalidated.
- **Not in the app:** editing a booking (the API has none). A slot that has already passed today is not disabled on the device, because the phone's clock may differ from the server's; the server refuses it.

## Register Customer

The Register Customer module (`src/modules/RegisterCustomer`) talks to `v1/register-customer` (`digitalapproval/Modules/RegisterCustomer`). It follows `PriceApproval` (list, detail with `allowed_actions`, action, create, export). Manifest `permission` is any of `create_registercustomer`, `read_registercustomer`, `readall_registercustomer`, `approve_as_manager_registercustomer`, `approve_as_finance_registercustomer`, the same either-or the backend middleware uses. The create button and `POST /` need `create_registercustomer`. The public form and Generate Reference stay on the web.

- **Actions:** `confirm`, `approve`, `reject`, `revise`. The server picks the stage (`awaiting_stage`: `CONFIRMATION`, `MANAGER`, `FINANCE`) and `allowed_actions` follows it. `reject` and `revise` need a reason of 6 to 191 characters, checked on the device first (`useConfirm`'s `reason.minLength`). The finance `approve` completes the document and needs a `customer_code` that master data does not use yet, so it opens `CustomerCodeSheet` instead of the confirm dialog; a code already in use comes back as a 422 and nothing changed.
- **Keys:** `registerCustomerKeys.list(filters, search)` and `detail(uuid)`. Filters (status, date range) sit in `store/registerCustomerFilterStore.ts` and reset on sign-out. Search goes to the server. A status filter may join several statuses with commas (the "Awaiting" chip). The date range is both ends or neither; the sheet will not apply half a range.
- **Create** (`/register-customer/new`) is four steps (customer, contact and owner, documents, review) with the draft in `useState`, like PriceApproval. It is saved and submitted in one call, as multipart (`api/buildCreateForm.ts`). The dropdown values (category, business form, business and tax status) are constants in `create/options.ts` because the API has no endpoint for them: the server refuses anything else with a 422. A business form of `TOKO` or `PERORANGAN` is identified by a 16-digit ID card number, the others by a tax number; only the matching one is sent. Documents are JPG, PNG or PDF up to 2 MB; the ID card and tax ID are always required, the address statement when the shipping address differs, and the deed and the grouping permit when the customer is part of a group (`documentRequirement`). A document the form no longer asks for is not sent.
- **Files:** documents (`/{uuid}/documents/{key}/download`) and attachments (`/{uuid}/attachments/{id}/download`) go through `apiClient.getFile` and `shareFile`; the absolute `download_url` the server sends is not used.
- **Export** (`GET /export`) is an `.xlsx` of a date range of at most 31 days (both ends counted). Nothing is cached.
- **Inbox and push:** the module id is `register-customer`, the slug the backend notifies with, and `detailRoute` opens the document.

## Marketing Activity

The Marketing Activity module (`src/modules/MarketingActivity`) talks to `v1/marketing-activity` and `v1/marketing-activity-combination` (`digitalapproval/Modules/MarketingActivity`, MAF). Both groups share one controller and one response shape, so the module is one tile with a Single | Combination switch. It follows `PriceApproval` (list, detail with `allowed_actions`, action, export) and has no create: the API cannot create or edit an activity, fill in realization, or download attachments yet, so those stay on the web. Manifest `permission` is any of `read_marketing_activity_marcom`, `read_marketing_activity_marcom_asusnb`, `read_only_all_marketing_activity`, the same either-or the backend middleware uses.

- **The group is part of the document's identity.** A uuid is only valid in its own group; the other group answers 404. So `kind` (`single` | `combination`) is in every query key (`marketingActivityKeys.list(kind, filters, search)` and `detail(kind, uuid)`), in the api paths and in the detail route (`/marketing-activity/<uuid>?kind=combination`; Single has no query).
- **Actions:** `approve`, `reject`, `revise`, `finish_realization`, `complete`, `claim`. The server decides which the user may do. `reject` and `revise` need a reason of 6 to 191 characters, checked on the device first (`useConfirm`'s `reason.minLength`). `claim` carries a proof file (docx, doc, xls, xlsx, csv, jpg, png, pdf, zip, msg, up to 10 MB) picked in `ClaimSheet`, and goes as multipart; every other action is JSON. A refused claim file (422) closes the sheet, so the user picks the file again.
- **Filters** (status, `last_updated_tier`, date range) sit in `store/marketingActivityFilterStore.ts` with the chosen `kind`, and reset on sign-out. Search goes to the server. The `mkt_code` filter is not offered: the API has no brand lookup.
- **Export** (`GET /export` of the chosen group) is an `.xlsx` of a date range of at most 31 days (both ends counted), without drafts. Nothing is cached.
- **Inbox and push:** the backend notifies the Combination group under its own slug, `marketing-activity-combination`. The manifest `id` is `marketing-activity` and lists the other slug in `aliases`; the shell finds the module through `findManifest` (`navigation/find-manifest.ts`), and `detailRoute(docUuid, slug)` opens the document in the right group.

## Marketing Promo

The Marketing Promo module (`src/modules/MarketingPromo`) talks to `v1/marketing-promo` and `v1/marketing-promo-combination` (`digitalapproval/Modules/MarketingPromo`). It is built like Marketing Activity: both groups share one controller and one response shape, so it is one tile with a Single | Combination switch. It follows `PriceApproval` (list, detail with `allowed_actions`, action, export) and has no create: the API cannot create or edit a promo, and the post-approval stages (recap, realization, additional cost, revision cost) stay on the web. Manifest `permission` is any of the promo roles (`create_marketing_promo_marcom`, `create_marketing_promo_marcom_asusnb`, the six `approve_marketing_promo_as_*` and `read_only_all_marketing_promo`), the same either-or the backend middleware uses.

- **The group is part of the document's identity.** Same as Marketing Activity: `kind` (`single` | `combination`) is in every query key (`marketingPromoKeys.list(kind, filters, search)` and `detail(kind, uuid)`), in the api paths and in the detail route (`/marketing-promo/<uuid>?kind=combination`).
- **Actions:** `approve`, `reject`, `revise`, `cancel`. The server decides which the user may do; `cancel` is for the applicant. `reject`, `revise` and `cancel` need a reason of 6 to 191 characters, checked on the device first (`useConfirm`'s `reason.minLength`). Every action is JSON.
- **Filters** (status, `tier`, date range on the promo date) sit in `store/marketingPromoFilterStore.ts` with the chosen `kind`, and reset on sign-out. Search goes to the server. The `mkt_code` filter is not offered: the API has no brand lookup.
- **Files:** the PDF (`/{uuid}/pdf`), the mechanism document (`/{uuid}/mechanism/download`) and each attachment (`/{uuid}/attachments/{id}/download`) go through `apiClient.getFile` and `shareFile`; the absolute URLs the server sends are not used.
- **Export** (`GET /export` of the chosen group) is an `.xlsx` of a date range of at most 31 days (both ends counted), without drafts. Nothing is cached.
- **Inbox and push:** the backend notifies the Combination group under `marketing-promo-combination`. The manifest `id` is `marketing-promo` and lists the other slug in `aliases`; `detailRoute(docUuid, slug)` opens the document in the right group.

## Laporan Penjualan

The Laporan Penjualan module (`src/modules/LaporanPenjualan`) is read-only and talks to `v1/wall-report` (`digitalapproval/Modules/WallReport`). Manifest `permission` is any of `read_all_wallreport`, `read_wallreport_by_group`, `create_wallreport`, `read_wallreport_by_branch`, `read_wallreport_by_brand`, the same either-or the backend controller uses. The server scopes the figures (branch, brand) by permission; the app never filters them.

- **Period:** `store/laporanPenjualanPeriodStore.ts` holds the chosen `YYYY-MM`, or `null` for the server's default; it resets on sign-out. The period sheet loads `GET /periods` only while open. The summary keeps the previous period on screen while the next loads (`keepPreviousData`).
- **Freshness:** the sales team updates the data once a morning, between 09:00 and 10:00, and rarely corrects it later. So the three queries (summary, group, periods) override the 60 s default: `staleTime` is a function (`reportStaleTime`, `hooks/report-freshness.ts`) that makes a loaded report fresh until the next 10:00 in the phone's time zone, and `gcTime` is 24 h so leaving the menu does not drop the cache. Data loaded before 10:00 goes stale at 10:00 the same day, because the update may not have finished. Within that window, opening the menu, switching period and coming back from the background make no request. Memory only, nothing on disk (see Persistence).
- **One request loads everything:** the summary query's `queryFn` is `loadReport` (`hooks/load-report.ts`). It calls `GET /bundle`, which answers the summary **and the detail of every group** of the period, puts each detail in the cache under `group(period, name)` (the key the group page reads) and returns the summary. So a group page opens from the cache with no request and no loading, and the server computes the report once per user a day instead of once per brand. A server that answers 404 to `/bundle` (older version, the app can ship first) is remembered for the session and the report loads the old way: `GET /` for the summary and `GET /group` when a group opens.
- **Server cache** (`digitalapproval`, `WallReportCache`): `bundle`, `index`, `group` and `periods` all read one cached result per period and user scope (branch office and the list of brand groups, so users with a different scope never share an entry). It is emptied by the `FlushWallReportCache` middleware after any successful write to sales data, targets or group/branch masters, and expires after `wallreport.cache_ttl_minutes` (6 h) as a safety net. The routes are throttled at 60 requests a minute per user.
- **Update data:** the "Update data" row in the top bar's Actions sheet (`useRefreshReport`) invalidates the whole `laporanPenjualanKeys.all` family: what is on screen reloads now (and reloads the bundle), groups opened later reload when they open. It shows "Updated <time>" from `dataUpdatedAt`, is disabled offline, and **is usable once an hour**: while `now < dataUpdatedAt + 1 h` (`canRefresh`) it is disabled and says "Available at <time>". The hour counts from when the data was last loaded, by whatever loaded it. The summary screen has **no pull to refresh**, so nothing skips that limit; the group page keeps its own pull to refresh, which only reloads that group from the server's cache.
- **Keys:** `laporanPenjualanKeys.summary(period)`, `group(period, name)` and `periods()`.
- **Group detail** (`/laporan-penjualan/[group]`, name URI-encoded) reads `GET /group?group=&period=`, normally already in the cache from the bundle; a group outside the period or the user's scope answers 404, shown as "Group not found".
- **Group card sparkline** plots the group's sales per day with transactions, read from `daily_totals` on each group of the summary (`groupSeries`); a server that does not send it yet gets the weekly figures. **Never fetch `GET /group` from a card to get the days**: that endpoint recomputes the whole report on every call, so one request per brand made the server slow (it was tried, and reported as slowness). Anything a list card needs comes with the summary, one request for all groups.
- **Branch filter** (status and branch chips under "Branches" on the group detail) is `useState` in the screen and narrows only the branch cards, on the device: `GET /group` answers every branch at once. Same pattern as the group filter, with `filterBranches`.
- **Group filter** (status and group chips under "Groups") is `useState` in the report and narrows only the group cards, on the device: `GET /summary` answers every group at once, so nothing is paged. The total and the branch chart keep showing the whole period.
- **Levels** (`below`, `near`, `achieved`) come from the server and show as a `Badge`; an unknown level shows as sent.
- **Export** (`GET /export` for Excel, `GET /pdf` for PDF) is the brand table of the period on screen, through `apiClient.getFile` and `shareFile`. Nothing is cached.

## Product Borrowing

The Product Borrowing module (`src/modules/ProductBorrowing`) talks to `v1/product-borrowing` (`digitalapproval/Modules/ProductBorrowing`). Products are lent to a customer and tracked until they come back. It follows `PriceApproval` (list, detail with `allowed_actions`, action, create, export). Manifest `permission` is any of `create_product_borrowing`, `read_product_borrowing`, `read_all_product_borrowing`, `approve_product_borrowing_as_product_manager`, `approve_product_borrowing_as_manager`, `process_product_borrowing`, `process_product_borrowing_as_logistic`, the same either-or the backend uses. The create button needs `create_product_borrowing`. The server scopes what each user sees (requester, product manager, marketing, logistics, or all); the app never filters it.

- **Status:** `AWAITING APPROVAL` → (Gudang Demo items) Marcomm Manager → `AWAITING PROCESS` → `BORROWED` → `RECEIVED`, with `REQUEST EXTEND`, `REVISE`, `REJECTED` and `CANCELED` on the side. Statuses stay `string`; the app labels the ones it knows (`components/status.ts`). Items, extensions and approval steps have their own statuses, shown with `stepBadge`.
- **Actions:** `approve`, `reject`, `revise`, `process`, `receive`, `approve_extend`, `reject_extend`, `cancel`. The server decides which the user may do. `reject`, `revise`, `reject_extend` and `cancel` need a reason of 6 to 1000 characters, checked on the device first (`useConfirm`'s `reason.minLength`). The app never sends `product_codes`, so an action covers every item the user may handle; handling single items stays on the web. `allowed_actions` also holds `edit` and `extend`, which are not sent to `/actions`: `edit` opens the resubmit form and `extend` opens `ExtendSheet`.
- **Keys:** `productBorrowingKeys.list(filters, search)`, `detail(uuid)` and `lookups()` (`options()`, `customers(search)`, `stock(warehouse, search)`; each enabled only while its picker is open). Filters (status, date range) sit in `store/productBorrowingFilterStore.ts` and reset on sign-out. The status filter may join several statuses with commas (the "Awaiting" chip). The date range is both ends or neither; the sheet will not apply half a range. Search goes to the server.
- **Create** (`/product-borrowing/new`) has no draft on the server: the document is saved and submitted in one call, as JSON (`api/buildPayload.ts`). Three steps: details (customer, address, phone, receiver, note), items, review. An item is a warehouse, a product in that warehouse (`GET /stock`, at most 20, so the product list follows the warehouse), a quantity, a borrow period, a product manager and a marketing person (both from `GET /options`), and optional remarks. A product may appear once per document. The quantity is checked against `available` from the stock lookup when the product was picked in this session; Gudang Demo stock is reserved for the document as soon as it is saved, and the server's answer wins (a 422 on `items.N.qty`).
- **Resubmit** (`/product-borrowing/resubmit/{uuid}`) is the same form, started from the detail when `allowed_actions` has `edit`. The body **replaces** the document, and carries the `updated_at` the form was filled from (taken once, with the draft). Items restored from the server have no stock figure until their product is picked again. Approval starts again from the product manager. `409` means it changed or is no longer in `REVISE`.
- **Extend** (`POST /{uuid}/extend`) asks for a new return date and a reason (6 to 1000 characters) for every item still `BORROWED`. The server checks the date against each item (later than its return date, at most 31 days after it), so the sheet shows only the latest return date and leaves the rule to the 422.
- **Files:** the PDF (`/{uuid}/pdf`) goes through `apiClient.getFile` and `shareFile`; the absolute `pdf_url` the server sends is not used.
- **Export** (`GET /export`) is an `.xlsx` of a date range of at most 31 days (the sheet allows 30), without drafts. It does not carry the list's status filter or search: the file holds every document in the user's scope for those dates. Nothing is cached.
- **Inbox and push:** the module id is `product-borrowing`, the slug the backend notifies with (`data.doc_uuid` is the document's `uuid`), and `detailRoute` opens the document.

## Data Product

The Data Product module (`src/modules/DataProduct`) is read-only and talks to `v1/product` (`digitalapproval/Modules/Product`). Manifest `permission` is `read_product`. Everyone who holds it sees every product; the server does not scope by category and hides deleted products. Stock is not here: it belongs to Stock Penjualan.

- **List** (`GET /`) is searched on the server (`search` matches name, code or SKU), paged 15 at a time, newest first, rows de-duplicated by `id`. **Detail** (`GET /{id}`) adds group, specification, base `price`, `price_tiers` (null without a price list) and every picture. A product that is gone or deleted answers 404, shown as "Product not found".
- **Keys:** `dataProductKeys.list(filters, search)`, `detail(id)` and `categories()` (loaded only while the filter sheet is open). The category filter sits in `store/dataProductFilterStore.ts` and resets on sign-out; the search text is `useState`. Both go to the server (`category_code`, `search`).
- **Categories** come from `GET /categories` of the same module: only categories that still have a product, by name, not paged. The sheet edits a draft and writes the store on Apply.
- **Pictures** are absolute URLs of server files, drawn with `expo-image`; a product without one shows a placeholder icon.
- **Freshness:** a read-only detail keeps the default `staleTime` (60 s). There is no action, so nothing depends on it being current.

## Data Customer

The Data Customer module (`src/modules/DataCustomer`) is read-only and talks to `v1/customer` (`digitalapproval/Modules/Customer`). Adding, editing (with the finance approval of a change), deleting, attachments and import stay on the web. Manifest `permission` is `read_customer` or `read_all_customer`, the same either-or the backend middleware uses. The server scopes the rows: `read_all_customer` sees every office, `read_customer` only the user's own office, and a user without an office sees none. The app never filters by office.

- **List** (`GET /`) is searched on the server (`search` matches name or code), paged 15 at a time, newest first, rows de-duplicated by `id`. Customers marked "(TIDAK DIPAKAI)" are not listed. **Detail** (`GET /{id}`, the numeric `id`, not `customer_id`) adds contact, person in charge, shipping and extra addresses, business and tax data, owner and the record's audit fields. A customer that is gone or outside the user's office answers 404, shown as "Customer not found".
- **Locked customer:** `is_locked` means a change waits for finance. `pending_change` says who asked and when, never what; the detail shows it as an `Alert`.
- **Keys:** `dataCustomerKeys.list(search)` and `detail(id)`. There is no filter store: the only filter is the search text, which is `useState`.
- **No office or category filter yet.** The API accepts `office_code` and `category`, but offers no list of either to choose from (`category` is free text). Add the filters when the backend gives the module a lookup.
- **Freshness:** a read-only detail keeps the default `staleTime` (60 s). There is no action, so nothing depends on it being current.

## Stock Gimmick

The Stock Gimmick module (`src/modules/StockGimmick`) is read-only and talks to `v1/stock-gimmick` (`digitalapproval/Modules/Stock`, the web menu Stock Item Marketing). Stock changes only through Marketing Inbound, Outbound and Request: Inbound and Request are in the app (see Marketing Gimmick), Outbound stays on the web. One row is one item in one office. Manifest `permission` is `read_stock_marketing`, `read_all_stock_marketing` or `read_product_manager_stock_marketing`, the same either-or the backend middleware uses. The server scopes the rows (all offices, the user's office, or only the categories a product manager holds); a row outside the scope answers 404, shown as "Stock not found". The app never filters by office.

- **List** (`GET /`) is searched on the server (`search` matches name or code), paged 15 at a time, newest first, rows de-duplicated by `id`. `product_name` and `office_name` can be `null` when the master is gone. **Detail** (`GET /{id}`, the numeric row `id`) adds `last_transaction_label`, `image_url` and `created_at`.
- **Track Stock** (`GET /{id}/movements`) is a second query on the detail screen, not part of the detail, so a failed history never hides the stock. It answers the whole history unpaged, newest first, with a signed `qty` and the running `balance` after each event; `summary` holds the totals. The screen shows it under "History" with its own skeleton and its own retry. `kind` and `direction` stay `string`; an event with `pending: true` is shown as "Waiting for action" (stock is already taken, the document is not settled).
- **Keys:** `stockGimmickKeys.list(search)`, `detail(id)` and `movements(id)`. There is no filter store: the only filter is the search text, which is `useState`.
- **Export** (`GET /export`) is an unfiltered `.xlsx` of every row the user may see, through `apiClient.getFile` and `shareFile`, from the toolbar actions menu. Nothing is cached. For a product manager the file holds only the categories they hold, while the list also shows whole brands (SanDisk, Western Digital); the numbers can differ.
- **Freshness:** a read-only detail keeps the default `staleTime` (60 s). Pull to refresh reloads the detail and its history together.

## Marketing Gimmick

The Marketing Gimmick module (`src/modules/MarketingGimmick`) talks to `v1/marketing-inbound` and `v1/marketing-request` (`digitalapproval/Modules/TransaksiMasukMarketing` and `TransaksiKeluarMarketing`; the API docs group is `marketing-transactions`). Both flows share one table and one response shape, so one code base serves both, with `flow` (`inbound` | `request`) choosing the path, keys and rules (`flows.ts`). It exports **two manifests**, so Home and Apps show two tiles, each with its own permission. Outbound (`v1/marketing-outbound`) has the same shape and is not in the app yet: it needs a `receive` proof upload and a destination that may be "LAIN-LAIN"; add it as a third entry in `flows.ts`.

- **Permissions** (manifest, either-or like the backend): Inbound `read_`, `read_all_`, `create_`, `approve_marketing_inbound_transactions`. Request `read_`, `create_`, `approve_`, `processed_`, `received_marketing_request_transactions`. The create button needs `create_marketing_<flow>_transactions`. The server scopes the rows (all offices, the user's office, or the user's own documents); the app never filters.
- **Status:** Inbound `AWAITING` → `SUCCESS` or `REJECTED`. Request `AWAITING` → `AWAITING PROCESSED` → `AWAITING RECEIVED` → `RECEIVED`, with `REJECT` and `CANCEL`; a request to office 1 or 2 skips `AWAITING RECEIVED`. Statuses stay `string`; `components/status.ts` labels the ones it knows (`SUCCESS` reads "Approved").
- **Actions** through `POST /{uuid}/actions` with `{action, remarks?, updated_at}`: `approve`, `reject`, `process`, `receive`, `cancel`. The server decides which the user may do (`allowed_actions`); the bar ignores any other name. A remark of at most 191 characters is required for `reject` on Inbound, and for `approve`, `reject` and `process` on Request (`flows.reasonRequired`); the confirm dialog asks for it and the server checks again. `cancel` and `receive` take none. 409 means the document changed or the action is gone; the detail and lists reload.
- **Keys:** `marketingGimmickKeys.list(flow, filters, search)`, `detail(flow, uuid)`, `offices(flow)` and `items(flow, search)`. The first segment is the flow's manifest id (`marketing-inbound`, `marketing-request`), so the two flows never share a cache entry. Filters (status, date range) sit in `store/marketingGimmickFilterStore.ts`, one set per flow, and reset on sign-out. Search goes to the server (`do_no`, remarks, creator). The status filter may join several statuses with commas (the "Awaiting" chip).
- **Create** (`/marketing-<flow>/new`) is one form, saved and submitted in one call as multipart (`api/buildCreateForm.ts`); the draft is `useState`. Fields: destination office (Request only, `GET /options`, narrowed on the device), remarks (required), a proof (Inbound: required) or attachment (Request: optional), and 1 to 50 items. A file is JPG, PNG or PDF up to 2 MB, checked on the device first. An item is a `code_item` from `GET /items` (a server search of at most 20) and a quantity of 1 to 100,000; an item may appear once. `available` is the stock the user may still use (Head Office stock for Request) and caps the quantity on the device; Inbound adds stock, so `available` is `null` and nothing caps it. The server locks and checks stock itself: a 422 on `items.N.qty` saves nothing. A timeout or lost connection may have saved it, so the lists reload and the user is told to check before sending again. After a save the item pickers reload, because stock moved.
- **Files:** the proof or attachment is `attachments[]` of the detail (`slot` `doc`); it goes through `apiClient.getFile` at `/{uuid}/attachments/{slot}` and `shareFile`. The absolute `url` the server sends is not used.
- **No export, no PDF:** the API has neither for these flows.
- **Inbox and push:** the module ids are `marketing-inbound` and `marketing-request`, the slugs the backend notifies with (`data.doc_uuid` is the document's `uuid`), and each `detailRoute` opens the document.

## Audit

The Audit module (`src/modules/Audit`) talks to `v1/audit` (`digitalapproval/Modules/Audit`). A card is one audit with its checklist, attachments, Audit Programs, Audit Findings and approval log. Manifest `permission` is any of `read_audit`, `read_all_audit`, `approve_audit`, the same either-or the list endpoint uses. The server scopes the rows (owner, Responsibility, finding PIC, approver); the app never filters them. The detail endpoints carry no module permission on purpose: a PIC or Responsibility without one of those can still open a card from a push, but the module tile and its routes stay hidden for them.

- **Status:** `PLANNED` → (`start`) `ON PROGRESS` → (`submit`) `AWAITING FOLLOW UP` → (`follow_up`) `AWAITING APPROVAL` → (`approve` / `reject`) `COMPLETED` / `REJECTED`. The last two are final. Statuses stay `string`; `components/status.ts` labels the ones it knows.
- **Actions:** `start`, `submit`, `follow_up`, `approve`, `reject` through `POST /{uuid}/actions` with `{action, remarks?}`. The server picks who may and `allowed_actions` follows it. **This API has no `updated_at` and no 409**: the server re-checks under a lock and refuses an action that is not the user's, does not fit the status or is not ready (a finding without PIC, a response or a due date) with **422 and the reason in `message`**, which the action bar shows as it is. A 422 therefore changes nothing and reloads nothing. `reject` needs a reason of at least 6 characters, checked on the device; the server does not require it.
- **Keys:** `auditKeys.list(filters, search)`, `detail(uuid)`, `part(uuid, part)` and `actionCount()`. Every part of a card (`checklists`, `attachments`, `programs`, `findings`, `approvals`) sits **under** `detail(uuid)`, so invalidating the detail refreshes them all. After an action the detail is set from the response and the parts, lists and the count are invalidated.
- **Detail views:** the detail is one screen with a four-way `SegmentedControl` (Overview, Program, Findings, History). Only the open view is mounted, so a part is requested only when the user opens it. Parts keep `staleTime: 0`, because what the user may do in them follows the card's status.
- **List:** `tab` (`planned`, `on_progress` need `create_audit`; `follow_up`; `finding`; `approval` needs `approve_audit`) is a chip row and `status`, `year` and `month` (the month the Period Activity starts in; a month needs a year) are in the filter sheet. Both sit in `store/auditFilterStore.ts` and reset on sign-out. Search goes to the server. Rows are de-duplicated by `uuid`.
- **Waiting count:** `GET /action-count` (Responsibility's `AWAITING FOLLOW UP` cards plus the approver's `AWAITING APPROVAL`) feeds a card above the list that opens the matching tab. It is a hint: a failure just hides it.
- **Finding response:** the PIC or Responsibility fills the Auditee Response and Due Date with `PUT /{uuid}/findings/{id}/response` while the card is `AWAITING FOLLOW UP`, where the finding's `can_respond` is true. Either field may be empty (the server keeps a half-filled finding and clears what is sent empty). On success the findings list shows the server's copy of that finding and the card and count reload. A past due date is refused by the server (422); the app does not check it against the phone's clock.
- **Evidence:** `POST /{uuid}/findings/{id}/attachments`, multipart (`file`, `description`), up to 30 MB of xlsx, xls, csv, doc, docx, pdf, jpg, png, jpeg, msg or zip, checked on the device first (`components/file-problem.ts`). The file comes from `pickFile`. A failed upload reloads the findings, because a lost connection may still have saved it.
- **Files:** card and finding attachments go through `apiClient.getFile` and `shareFile`; the absolute `download_url` the server sends is not used.
- **Not in the app:** creating or editing a card, assigning it, the checklist, program and finding CRUD, Excel upload and the two Excel exports stay on the web. The API has them; add them when mobile needs them.
- **Inbox and push:** the module id is `audit`, the slug the backend notifies with (`data.doc_uuid` is the card's `uuid`), and `detailRoute` opens the card.

## Sales & Inventory Analysis

The Sales & Inventory Analysis module (`src/modules/SalesInventoryAnalysis`) is read-only and talks to `v1/sales-inventory-analysis` (`digitalapproval/Modules/SalesInventoryAnalysis`). Manifest `permission` is any of `read_sales_inventory_analysis_by_all`, `read_sales_inventory_analysis_by_branch`, `read_sales_inventory_analysis_by_brand`, the same either-or the backend controller checks (`403` otherwise, shown as "No access"). The server scopes every figure (all, own branches, or the brands the user manages as PM); the app never filters by scope, and `meta.scope` is not shown.

- **Four views, one screen.** Inventory, Target, Activity and Inactive dealers are chips in the toolbar (`useState`, not a route). Each view is its own component with its own query, so only the open view is requested. Every view is one `GET` that answers all of its data, unpaged.
- **Keys:** `salesInventoryAnalysisKeys.inventory(selection)`, `achievement(selection)`, `dealerActivity(selection)`, `inactiveDealers(selection)` and `filters()` (loaded only while the filter sheet is open). The selection is part of every key.
- **Filter:** branch and brand are multi-select, in `store/salesInventoryAnalysisFilterStore.ts` (reset on sign-out), edited as a draft in the sheet and written on Apply. They are sent as repeated `branch[]` and `brand[]` parameters: `apiClient` turns an array query value into that form, and an empty list is left out. The choices come from `GET /filters`, already limited to the user's scope.
- **Not offered yet:** `periode` (Inventory) and `tanggal` (the other three) are left to the server: the last full month and today. `GET /filters` answers only the default months.
- **Freshness:** default `staleTime` (60 s) with `keepPreviousData`, so a new filter keeps the old figures on screen under "Applying filters". The server caches Inventory for 15 minutes and clears it after a stock import or a wall report upload; the API has no forced refresh, so pull to refresh only asks the server again. Inventory shows "Stock as of" from `meta.last_stock_updated_at`.
- **Statuses** (`NEED_ORDER`, `NORMAL`, `OVERSTOCK`, `NO_MOVEMENT`; `ABOVE_LINEARITY`, `ON_TRACK`, `WARNING`, `CRITICAL`, `NO_TARGET`) stay `string`. `components/status.ts` picks the badge tone by key, not from the server's `status_color`; an unknown one shows with its own label.
- **Inactive dealers** are unpaged and can run to hundreds, so a branch draws its dealers only while it is open.
- **Null figures:** `achievement_percentage`, `gap_percentage`, `moh` and `growth` are `null` when there is nothing to divide by; they show as a dash.

## Backend contract

What a module's v1 API must provide for this to work. `PriceApproval` (`digitalapproval/Modules/PriceApproval`) is the reference.

- **Envelope:** `{success, message, data, meta}` on success; `{success: false, message, errors}` on failure.
- **List:** `GET /v1/<module>?status=&page=&per_page=`, with `meta` holding `current_page`, `per_page`, `total`, `last_page`. Sorted with a unique tiebreaker so pages stay stable.
- **Detail:** `GET /v1/<module>/{uuid}`, including:
  - `updated_at` (ISO 8601): the concurrency reference.
  - `allowed_actions`: what the current user may do now, computed with the same rules the web uses.
- **Action:** `POST /v1/<module>/{uuid}/actions` with `{action, remarks?, updated_at}`.
  - The server derives the user's tier or role. The client never sends it.
  - It runs the action under a row lock and re-checks the state.
  - Answers:
    - `200` with the fresh detail;
    - `409` when `updated_at` differs, or the action is not (or no longer) available;
    - `422` for invalid input;
    - `404` when the record is outside the user's scope.
- **Never `200 {result: false}`.**
- **Inactive account:** every API route sits behind `auth:sanctum` + `user.active`. For `api/*`, `user.active` revokes all the user's tokens and answers **401** (`auth.suspend`), so the app signs out. 403 on the API means a missing permission only. Deactivating a user on the web also revokes the tokens (`UserController::update`).
- **Permissions:** guard each endpoint with `permission:` middleware, the same names as the manifest `permission`. Spatie clears its permission cache when a role or permission changes, so the next request already sees the change.

## Adding data to a new module

1. `api/<name>Keys.ts`: the key factory, first segment = manifest `id`.
2. `api/<name>Api.ts` and `types/`: the endpoints and wire types. Field names follow the wire format, and statuses are `string`.
3. `hooks/use-<name>s.ts` (list) and `hooks/use-<name>.ts` (detail): pass `signal`, and use `staleTime: 0` on an actionable detail.
4. `hooks/use-<name>-action.ts`: copy `use-price-approval-action.ts`.
5. Screens: every state from ui-foundation's [States](ui-foundation.md#states), including offline with data and the time of the last refresh.
6. If the module keeps UI state in zustand, reset it on sign-out.
7. Tests:
   - the action hook (success writes the server copy; conflict keeps the cache and refetches; validation refetches nothing);
   - the action component (only allowed actions, input validation, offline disabled).
8. Backend: list, detail with `updated_at` + `allowed_actions`, and the action endpoint, with feature tests covering double submission (409) and a stale `updated_at` (409).

## Creating a record

`PriceApproval` create (`/price-approval/new`) is the reference for a multi-step form.

- **The draft is `useState` in the screen**, not a store and not the query cache: it is UI state, lost on leaving. Leaving with work in it asks first (`usePreventRemove` + `useConfirm`).
- **Pickers** (customers, products, product managers) are server searches through `priceApprovalKeys.lookups()`, enabled only while their sheet is open. The server limits each answer to 50 rows.
- **Validation** lives in `create/draft.ts`, per step, and runs again for every step on submit. Errors show only after the user presses Next.
- **Submit** is confirmed, disabled offline, and sent once as multipart (`api/buildCreateForm.ts`). No optimistic update: on `201` the screen stores the server's detail under `detail(uuid)`, invalidates `lists()` and replaces itself with the detail screen. A 422 changes nothing; a timeout or lost connection may have saved it, so the lists refresh and the user is told to check before sending again.
- **Totals** are previewed with `create/calculate-line.ts`, the same formula as the server's `PriceApprovalLineCalculator`. The server's figure wins.
- **Files** come from `core/files` (`pickFile`, `toUploadBlob`; `expo-document-picker`, needs a development build).

## Request Design

The Request Design module (`src/modules/RequestDesign`) talks to `v1/request-design` (`digitalapproval/Modules/RequestDesign`; the API docs group is `request-design`). Marketing asks the graphic designer for images and videos; the designer picks the request up, hands in the result and an approver signs it off. Manifest `permission` is any of `create_requestdesign`, `read_requestdesign`, `read_all_requestdesign`, `picked_requestdesign`, `approved_requestdesign`, `analytics_requestdesign`, `analytics_all_requestdesign`, the same either-or the backend uses. The create button needs `create_requestdesign`. The server scopes the rows (all, or only the user's own or picked ones); a request outside the scope answers 404, shown as "Request not found". The app never filters.

- **Status:** `AWAITING PICK` → (`pick`) `PICKED` → (`submit_file`) `AWAITING APPROVAL` → (`approve`) `COMPLETED`. Branches: the designer asks for a later due date (`REQUEST DUE DATE`) and the requester accepts or declines it, which returns it to `PICKED`; the requester cancels (`CANCEL`) while it is `AWAITING PICK` or `PICKED`. A requester who holds `approved_requestdesign` creates `HIGH` priority requests, and one who holds `picked_requestdesign` creates them already `PICKED`. Statuses stay `string`; `components/status.ts` labels the ones it knows.
- **Actions:** `pick`, `request_due_date`, `approve_due_date`, `reject_due_date`, `approve`, `assign`, `set_priority`, `set_points`, `cancel` through `POST /{uuid}/actions`, `submit_file` through `POST /{uuid}/submit-file` and `edit` through the form (below). The server decides which the user may do (`allowed_actions`); the bar ignores any other name. All send `updated_at`: 409 means the request changed or the action is gone, and the detail and lists reload (`hooks/use-detail-write.ts`). The bar shows the first action as a button and folds the rest under "More". `cancel` asks for a reason of 6 to 1000 characters in the confirm dialog. The others that need input open a sheet (`components/actions/`): a new due date, a designer (from `GET /options`), a priority (`HIGH` or `MEDIUM`), the points per category and the result (a link, or a file of up to 20 MB). The points may not add up to more than the request's total pieces, `OPTIONAL` excluded (`create/points.ts`); the server checks again.
- **Keys:** `requestDesignKeys.list(filters, search)`, `detail(uuid)` and `options()`. Filters (status, priority, request date range) sit in `store/requestDesignFilterStore.ts` and reset on sign-out. Search goes to the server (number, description, requester). The "In progress" chip joins the four open statuses with commas. Rows are de-duplicated by `uuid`. The list is sorted by the server: open `HIGH` priority first, then newest.
- **Create and edit** share one form (`screens/request-design-form.tsx`), saved and submitted in one call as multipart (`api/buildForm.ts`). Fields: due date (today or later), one or more brands, theme (191 characters), description (5000) and 1 to 50 items. What an item asks for follows its type, the way the server validates it: an image needs a purpose (digital: where it is used; physical: width and length in cm), a video needs a duration; each item takes up to three reference files (JPG, PNG, PDF, DOC, DOCX, MP4, XLS, XLSX, up to 15 MB, checked on the device first). The form needs `GET /options` before it opens.
- **Edit** (`/request-design/edit/{uuid}`) is allowed while the request is `AWAITING PICK` and the user's own (`allowed_actions` holds `edit`). It replaces the whole document: it is sent as `POST` with `_method=PUT` (PHP does not read multipart on PUT) and the `updated_at` the form was filled from. An item that keeps its `id` keeps the files it has unless a new file replaces the one in its slot; the API cannot remove a single reference. The form is filled once from the detail, so a refetch never overwrites what the user is typing.
- **Files:** a reference is `items[].references[]` of the detail, the designer's file is `result` (`type` `FILE`); both go through `apiClient.getFile` (`/{uuid}/items/{item}/references/{slot}` and `/{uuid}/file`) and `shareFile`. A `LINK` result is opened in the browser. The absolute `download_url` the server sends is not used.
- **Points** (`points`) come only for designers and approvers; the section is hidden when it is `null`.
- **Export:** `GET /export` for a date range of at most 31 days (the sheet stops at 30). It exports everything the user may see in that range, not the list's filters.
- **Analytics** (`/request-design/analytics`, `GET /analytics?month&year`): points of the `COMPLETED` requests of one month per designer against the monthly target (`target_achieved` may pass 100), and the trend of the last three months. The month stepper stops at the current month. The icon in the list header needs `analytics_requestdesign` or `analytics_all_requestdesign`; the server answers 403 without one, and a user with only the first sees just themselves. Key `analytics(period)` sits under `analyticsAll()`, which every write on a request invalidates because approving completes it and `set_points` changes what was earned. While another month loads, the previous one stays on screen (`keepPreviousData`).
- **Not in the app:** the list filters by brand and designer. The API has them; add them when mobile needs them.
- **Inbox and push:** the module id is `request-design`, the slug the backend notifies with (`data.doc_uuid` is the request's `uuid`), and `detailRoute` opens the request.

## Sales Visitation

The Sales Visitation module (`src/modules/SalesVisitation`) talks to `v1/sales-visitation` (`digitalapproval/Modules/SalesVisitation`; backend docs `docs/api/api-architecture.md`, section 5N). A sales person plans a visit to a customer, then checks in and out on site with GPS and a camera photo. The manifest `permission` is any of `create_sales_visitation`, `read_sales_visitation`, `read_sales_visitation_team`, `read_sales_visitation_all`, `read_visitation_product_manager`. The plan button needs `create_sales_visitation`. The server scopes the rows (own, team, product manager, all); a visit outside the scope answers 404 and shows "Visit not found". The app never filters.

- **Status:** `PLANNED` → (`check_in`, on the visit date only) `CHECK-IN` → (`check_out`) `COMPLETED`. Statuses stay `string`; `components/status.ts` labels the ones it knows.
- **The server judges, the app collects proof.** Time, distance, time on site, the check-out note (`VISITATION COMPLETED`, `EARLY CHECKOUT`, `FORGOT VISITATION`, `NOT COUNTED VISITATION`) and the GPS `flags` are computed by the server from the panel rules (`GET /options` → `settings`). The app shows them and never decides them. The detail's `allowed_actions` (`update`, `delete`, `check_in`, `check_out`; empty unless the user planned the visit) is the only source of buttons.
- **Keys:** `salesVisitationKeys.list(filters, search)`, `detail(uuid)`, `options()`, `customers(term)`, `customerLocations(id)`, `geocode(term)` and `photo(uuid, type)`. Filters (status, visit date range) sit in `store/salesVisitationFilterStore.ts` and reset on sign-out. Search goes to the server (title, customer name). Rows are de-duplicated by `uuid`. The detail uses `staleTime: 0` because the actions depend on today's date.
- **Plan and edit** share one form (`screens/sales-visitation-form.tsx`), sent as JSON. A visit is for a registered customer (`customer_id`, picked from `GET /customers`, 2+ characters) or a free-text name (`is_unregistered` + `customer_name`); only registered ones get saved locations. One or more purposes and one or more brand categories are required. While `PLANNED` an edit replaces everything; after check-in the server accepts only `result`, so the form then shows the rest as text (`resultOnly`). Delete is only for `PLANNED`.
- **Location.** There is no map in the app. One search box (as on the web) takes a building, place or address, a pasted Google Maps link, or "lat, lng": the app tells which it is. The visit point also comes from this device's position, an address search (`GET /geocode`: Indonesia only, at most 8 hits, up to about 2 seconds; the server uses HERE or Photon as the panel says and the response shape is the same. The 1-per-second limit (429) applies to the Photon path, so it runs on the Search button and is never retried), a pasted Google Maps link or "lat, lng" (`GET /map-link`; plain coordinates are read on the device), or, for a registered customer, an earlier visit point or a registered address (`GET /customer-locations`). The detail opens the point in the phone's map app.
- **Check-in and check-out** (`/sales-visitation/check-in/{uuid}`, `/check-out/{uuid}`, `components/capture-view.tsx`): multipart with `latitude`, `longitude`, `accuracy`, `position_timestamp`, `client_now`, `is_mock`, `photo_source` (always `camera`: the gallery is not offered) and `photo` (max 5 MB). The position is read when the user presses the button, not earlier, because the server refuses a reading older than 120 seconds; `client_now` lets it judge the age by the phone's clock. If the panel does not require GPS and the phone cannot locate itself, the proof is left out; otherwise the user sees why. Check-out first asks `POST /check-out/preview` (saves nothing), shows the note and time on site in the confirm dialog, then reads the position again before the real write; the preview's numbers are never sent back.
- **Photos** (`GET /{uuid}/photo/in|out`) need the Authorization header, so `hooks/use-photo.ts` fetches the bytes through the api client and writes them to the cache folder (a blob url on web). `gcTime` is one minute so large images do not stay in memory.
- **Actions** wait for the server and then put its copy in `detail(uuid)` (`hooks/use-detail-write.ts`). A 422 changed nothing; a lost connection or timeout leaves the outcome unknown, so the detail and lists are read again and the user is told to check the visit before trying again. There is no `updated_at` concurrency reference: the server decides on the current status.
- **Native modules:** `expo-location` and `expo-image-picker` (camera). Both permissions are already in `app.json`. The location module is looked up before it is imported, so a build made without it shows a message instead of crashing.
- **Not in app:** export, reverse geocoding (coordinates to address), push notifications and a map to pick the point (none in the API or the dependencies).
