# Data management

How this app reads, caches, keeps, syncs and changes server data. **Read this before a module fetches or changes data.** It is the data counterpart of [ui-foundation.md](ui-foundation.md). `PriceApproval` is the reference implementation: copy its shape for a new module.

## The rule

**The Laravel backend is the single source of truth.** The app holds a copy for display and speed, nothing more.

- A status, total or permission is what the server last said. The app never writes a guessed value into the cache. There are no optimistic updates for business data.
- An action counts as done only when the server answers with success. The screen then shows the server's copy from that response.
- HTTP 200 is not the same as a successful business operation. Mobile endpoints must answer a refused action with a 4xx code (see [Backend contract](#backend-contract)), never `200 {result: false}` like the legacy web endpoints.

## Who owns what

| Data                                             | Lives in                                           | Persisted to disk | Notes                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Access token, expiry                             | `core/auth` → `core/storage` (SecureStore)         | Yes, encrypted    | Never in zustand state, never in the query cache. Web falls back to localStorage, which is for development only |
| Session user, roles, permissions                 | `core/auth` zustand store                          | No                | Reloaded from `/me` at startup                                                                                  |
| Favorite apps (module ids, in order)             | `navigation/favorite-apps-store.ts` → `core/storage` | Yes, per user     | A device preference, not server data: a short list under `favorite_apps_<userId>`. Read after sign-in, dropped on sign-out. Ids of apps the user may no longer open are hidden, not deleted |
| Server data (lists, details, counts)             | TanStack Query cache                               | **No**            | Memory only. See [Persistence](#persistence)                                                                    |
| UI state (filter, tab, search text, draft input) | A small zustand store in the module, or `useState` | No                | Never a copy of server data                                                                                     |

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

| `code`         | From                                  | Retried by queries | Show                                                        |
| -------------- | ------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `network`      | No response                           | Yes                | Offline or retry state                                      |
| `timeout`      | No answer within `REQUEST_TIMEOUT_MS` | Yes                | Same as `network`                                           |
| `server`       | 5xx                                   | Yes                | "Try again"                                                 |
| `unauthorized` | 401 with a token                      | No                 | Session cleared, so the user lands on sign-in automatically |
| `forbidden`    | 403                                   | No                 | No access. Hide the entry via the manifest `permission`     |
| `not_found`    | 404                                   | No                 | "Not found". Records the user may not see also answer 404   |
| `conflict`     | 409                                   | No                 | "This changed, review the latest version", and refetch      |
| `validation`   | 422                                   | No                 | `fieldErrors` on the fields                                 |
| `rate_limited` | 429                                   | No                 | Message                                                     |

## Query keys

Every module has one key factory. Its first segment is the manifest `id`, so two modules can never collide:

```ts
export const priceApprovalKeys = {
  all: ['price-approval'] as const,
  lists: () => [...priceApprovalKeys.all, 'list'] as const,
  list: (filter: PriceApprovalFilter, search: string) =>
    [...priceApprovalKeys.lists(), filter, search] as const,
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

There is no polling. Push notifications or WebSocket, when added, call the same module invalidation functions and change nothing else.

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
