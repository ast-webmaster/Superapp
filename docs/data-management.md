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

| Moment                        | Mechanism                                                |
| ----------------------------- | -------------------------------------------------------- |
| Screen opens                  | A stale query refetches on mount                         |
| App returns to the foreground | `focusManager`, wired to `AppState` (native)             |
| Connection returns            | `onlineManager`, wired to `expo-network` (native)        |
| After an action               | The mutation's `onSuccess` / `onError`                   |
| User pulls down               | `refetch()` from `RefreshControl` / `FlatList onRefresh` |

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

The AI chat tab (`src/modules/AiChat`) talks to `v1/ai-chat` (`digitalapproval/Modules/AiChat`). It is reached from its own tab, so it has no manifest; `navigation/ai-chat-screen.tsx` shows it when `useCan()` passes `AI_CHAT_PERMISSIONS` (the backend's `AiChatConversationService::READ_PERMISSIONS`) and the coming-soon page otherwise.

- **Keys:** `aiChatKeys.sessions()` (loaded only while the history sheet is open) and `aiChatKeys.messages(uuid)`.
- **Active chat and the message on its way are module state** (`store/aiChatStore.ts`, reset on sign-out), not the query cache. The in-flight message is shown as a bubble from that state and disappears once the server's history has it. It lives outside the screen so a send survives the screen going away.
- **Lazy session:** a new chat creates its session (`POST /sessions`) only when the first message is sent.
- **Send** waits for the AI, which can take minutes, so it gets `timeoutMs: 180_000`. On success the messages are refetched (awaited) and the session list invalidated. A 422 gives the message back with the server's reason. A timeout, lost connection or 5xx refetches the history; only if it has no new messages is the message offered back ("Edit and resend"). It is never resent automatically.
- **Progress polling** is the one exception to "There is no polling": while a send waits, `useChatProgress` asks `GET /progress/{trace_id}` every 700 ms for ten polls, then every 1800 ms, and stops when the send settles. Errors are ignored.
- **Files:** attachments (at most 3, 10 MB, images 5 MB, pdf/png/jpg/docx/xlsx/xls) are checked on the device first and sent as multipart `attachments[]`. Downloads and the Excel export go through `apiClient.getFile` and `shareFile`; the absolute `url` the server sends for an attachment is not used.
- **Voice** (`expo-speech-recognition`, needs a development build) turns speech into text on the device in `id-ID`; nothing is sent to the server until the user presses send.

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
