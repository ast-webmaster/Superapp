# AI chat: design

Date: 2026-11-14. Status: draft, waiting for approval.

## Intent

The AI chat tab (`/ai-chat`) shows "AI chat is coming soon" to everyone today. Users who are allowed to use the AI chat on the web should get a real chat on mobile, talking to the backend AI that already exists (`digitalapproval/Modules/AiChat`, API `v1/ai-chat`). Everyone else keeps today's coming-soon page unchanged.

The visual reference is the screenshot the user supplied: a conversation on the soft ground, user messages on the right, AI replies in a white card on the left with a small AI avatar, a time label above the conversation, and a floating composer at the bottom with `+` on the left, the text field, and a microphone on the right.

## Goals

- A chat screen for users holding any of the backend's AI chat permissions.
- Everything the backend offers, in the first version:
  - send text and see the reply, with live progress steps while the AI works;
  - session history: list, open, start new, delete;
  - attachments: up to 3 files per message (pdf, png, jpg, jpeg, docx, xlsx, xls), and download of attachments in past messages;
  - export of an answer to Excel when the server marks it `exportable`;
  - voice input (speech to text) through the microphone.
- Replies rendered from the backend's light markdown: `**bold**`, `*italic*`, `` `code` ``, and tables.

## Non-goals

- No suggestion chips under replies (`meta.suggestions` is ignored). The user said so explicitly.
- No streaming of the reply text: the backend answers in one response.
- No offline queue and no persistence of chat to disk (see `docs/data-management.md`).
- No change to the backend.

## Anti-goals

- Users without the permission must not see anything new: same page, same copy.
- A slow answer (tens of seconds) must never look like a frozen app or end in a false timeout error.
- Text the user typed must never be lost because a send failed.
- Server HTML or markdown must never be rendered as HTML (no `dangerouslySetInnerHTML`, no WebView): parse it into `AppText` nodes.

## Backend contract (already built)

All under `/v1/ai-chat`, behind `auth:sanctum`, `user.active` and `permission:` any one of:
`read_aichat`, `read_all_aichat`, `approve_product_borrowing_as_product_manager`, `approve_product_borrowing_as_manager`, `process_product_borrowing`, `process_product_borrowing_as_logistic` (`AiChatConversationService::READ_PERMISSIONS`). The standard envelope `{success, message, data, meta}` applies.

| Call | Answer `data` |
| --- | --- |
| `GET /sessions` | the 20 newest sessions: `[{uuid, title, created_at}]` |
| `POST /sessions` | `{uuid, title}` (title "Chat baru") |
| `GET /sessions/{uuid}/messages` | `{session: {uuid, title}, messages: [{uuid, role: 'user' \| 'assistant', message, meta: {type, suggestions, assumptions, exportable}, created_at, attachments: [{uuid, name, extension, size, url}]}]}`, `meta.total_tokens` |
| `POST /sessions/{uuid}/messages` | multipart or JSON: `message` (≤ 2000, optional when files are attached), `trace_id` (uuid, client-made), `attachments[]`. Synchronous, can take tens of seconds. Answers `{reply, message_uuid, meta, tokens, title, attachments}`. 422 for unreadable files or validation; 500 "Gagal menghubungi AI. Coba lagi." |
| `GET /progress/{trace_id}` | `{steps: [{key, label, status: 'running' \| 'success' \| 'error'}], done}`. Labels are Indonesian sentences from the server; show them as they are |
| `DELETE /sessions/{uuid}` | `null` |
| `GET /attachments/{uuid}` | the file bytes |
| `GET /messages/{uuid}/export` | an `.xlsx` (404 when the answer has no data) |

Another user's session answers 404. Files: max 10 MB each, images max 5 MB.

## Decided by the user

- Build the chat against this backend, gated by its permissions; the coming-soon page stays for everyone else.
- User messages use a **`primary-soft`** bubble with `ink` text instead of the screenshot's blue bubble, so they stand apart from the white AI cards.
- No suggestion chips.
- All features in one go, including voice, adding whatever library and config the microphone needs.

## The how

### Where the code lives

- New module `src/modules/AiChat/` with the usual folders: `api/` (`aiChatApi.ts`, `aiChatKeys.ts`), `types/`, `hooks/`, `components/`, `screens/`, `store/`, `index.ts`.
- `index.ts` exports `AiChatScreen` and `AI_CHAT_PERMISSIONS` (the six names above).
- `src/navigation/ai-chat-screen.tsx` stays the tab's screen: `useCan()(AI_CHAT_PERMISSIONS)` ? `<AiChatScreen />` : today's coming-soon page, unchanged. A permission lost while the tab is open swaps back on the next session refresh.
- *Builder's call recorded here:* no `manifest.ts` and no registry entry. The registry feeds the Home and Apps launchers, and the chat already has its own tab. AGENTS.md's "add a manifest" rule is for launcher modules; note this in the doc update.

### Data (follow `docs/data-management.md`)

- Keys: `aiChatKeys.all = ['ai-chat']`, `sessions()`, `messages(uuid)`.
- `useChatSessions()` (enabled only while the history sheet is open) and `useChatMessages(uuid | null)` (disabled for a new chat).
- **Active session** lives in a small zustand store in the module (`activeSessionUuid: string | null`, `null` = a new, unsaved chat), reset on sign-out like `priceApprovalFilterStore.ts`. The tab opens on a new chat when the app starts and keeps the active session while the app runs.
- **Lazy session:** a new chat creates its session (`POST /sessions`) only when the first message is sent, so opening the tab never adds an empty session.
- **Send** (`useSendChatMessage`, a mutation):
  - Generates a `trace_id` (a v4 uuid generator in the module).
  - Body: JSON without files; `FormData` with `attachments[]` from `toUploadBlob` (`core/files`) when there are files.
  - `timeoutMs: 180_000` on this one call (the client default of 20 s would cut normal answers).
  - While pending, the screen shows the user's message as a **pending bubble** built from the draft (UI state, not written into the query cache) and an AI card with progress.
  - On success: `setQueryData`-free; invalidate and await `messages(uuid)`, invalidate `sessions()`, then drop the pending bubble. The server's history is what shows.
  - `validation` (422): nothing was saved. Put the text and files back in the composer and show the server message.
  - `network`, `timeout`, `server`: the outcome is unknown. Refetch `messages(uuid)`; if the user's message is not in it, show an error row under the conversation ("Could not send. Try again.") whose button puts the text back in the composer. Never resend automatically.
- **Progress polling** (`useChatProgress(traceId | null)`): polls `GET /progress/{trace}` only while a send is pending, every 700 ms for the first 10 polls and then every 1800 ms (the web's rhythm), and stops when the send settles. This is the one exception to "There is no polling"; document it in `data-management.md`. Poll errors are ignored (progress is cosmetic).
- **Delete session:** confirmed with `useConfirm`, waits for the server, then invalidates `sessions()`, removes `messages(uuid)`, and if it was active, sets the active session to `null`.
- **Attachment download / export:** `apiClient.getFile` then `shareFile` (`core/files`), as `use-export-price-approvals.ts` does. Export filename: `ai-chat-<yyyyMMdd-HHmm>.xlsx`. Attachment filename: its `name`. Use the path `/ai-chat/attachments/{uuid}`; ignore the absolute `url` the server sends.
- **Offline:** composer send and mic disabled with the usual caption; cached conversation stays visible with the offline `Alert`.

### Screen

Compose from `@/shared/ui` and tokens only (`docs/ui-foundation.md`). Layout top to bottom:

1. `TabHeader` / `TopAppBar` titled "AI chat" with a `right` slot of two round icon buttons: **history** (`history`) opens a `Sheet` of sessions, **new chat** (`pencil`) sets the active session to `null`. New chat is disabled while a send is pending.
2. **Conversation**, a `FlatList` that stays scrolled to the newest message:
   - A centered muted caption with day and time ("Today · 1:42 PM") before the first message of each day, using `@/shared/utils/format`; add a formatter there if none fits.
   - **User message:** right-aligned, max ~80 % width, `primary-soft` fill, no border or shadow, `rounded-xl` with a smaller bottom-right corner, `body` text. Attachments show as small file chips above the text; tapping one downloads it.
   - **AI reply:** left-aligned white card (`surface`, `border border-border`, `rounded-xl`, `p-4`), with the small round AI avatar (`primary` fill, `ai` icon, `on-primary`) at its bottom-left like the screenshot. Content from the markdown renderer. `meta.assumptions`, when present, as a muted caption list under the text. When `meta.exportable`, a `soft` small button "Download Excel" under the card.
   - **Pending AI card:** the same card showing progress steps: `check` in `success` for done, a small spinner for running, `x` in `danger` for error, and "Thinking" before the first step arrives.
   - **Empty (new chat):** a quiet `EmptyState` with the `ai` icon, "Ask me anything", and one line on what it can do. No suggestion chips.
   - Loading a past session: skeleton bubbles. Error loading: `EmptyState` with retry.
3. **Composer**, floating above the bottom nav (`useBottomNavInset()`), moving up with the keyboard:
   - Selected files as removable chips above the field.
   - A white pill (`surface`, hairline): round `+` (attach), a multiline `TextInput` "Message AI…" (max 2000 characters, grows up to ~5 lines), and on the right the **mic** when the field is empty, or a round `primary` **send** (`arrow-up`) when there is text or a file.
   - `+` calls `pickFile()`; the device checks before adding: at most 3 files, allowed extensions, 10 MB per file and 5 MB per image, with a toast naming the limit.

### Markdown renderer

A pure function in the module, `parseReply(text)`, returning blocks: `paragraph` lines with inline spans (`bold`, `italic`, `code`, `text`) and `table` blocks (`header: string[]`, `rows: string[][]`), using the same rules as the web's `renderMarkdown` (`digitalapproval/Modules/AiChat/Resources/views/partials/core.blade.php`). A component renders blocks with `AppText` (`body`, `body-strong` for bold; italic via `italic` style; code with `surface-gray` fill). A table renders inside a `surface-gray` `rounded-lg` block, horizontally scrollable, header in `caption-strong`. Unit-test the parser.

### Voice

- Library: `expo-speech-recognition` (`58.0.x`, matches Expo SDK 58; installed with `npx expo install`). On-device speech to text, the same idea as the web's Web Speech API; it also works on web.
- `app.json`: add the plugin with `microphonePermission` and `speechRecognitionPermission` texts ("Allow Superapp to use the microphone so you can speak your messages to AI chat."), and **remove `android.permission.RECORD_AUDIO` from `blockedPermissions`**. Leave `expo-image-picker`'s `microphonePermission: false` as is. Check the library's iOS minimum against the project's.
- Behavior (matches the web's defaults, `lang: 'id-ID'`, `auto_send: false`): tapping the mic asks for permission on first use, then listens; interim results fill the field live; the result stays in the field for the user to review and send. Tapping again stops. While listening, the mic button shows a `danger` filled state with the label "Stop listening" for screen readers.
- Permission denied: toast explaining how to allow it in settings. Unsupported device or a build without the native module: hide the mic (guard with `requireOptionalNativeModule`, as `core/files/pickFile.ts` does); show send in its place.
- Lives in the module (`AiChat/voice/use-voice-input.ts`), since only the chat uses it.
- A new development build is needed afterwards (`eas build --profile development`).

### Copy

App copy in English, sentence case, as the UI foundation requires. Server text (replies, progress labels, error messages) is shown as the server sends it.

### Tests

- `parseReply`: bold, italic, code, tables, lines between tables, text that looks like HTML stays text.
- `aiChatApi` send body: JSON without files, multipart with files, `trace_id` present.
- `useSendChatMessage`: lazy session creation, invalidates on success, 422 restores the draft, timeout refetches and shows the error row.
- Composer: send disabled when empty or offline, file limits, mic shown only when supported and field is empty.
- `ai-chat-screen`: coming-soon page without permission, chat with permission.

### Docs to update

- `docs/data-management.md`: an "AI chat" section (lazy session, long send timeout, progress polling exception, pending bubble is UI state).
- `docs/ui-foundation.md`: a "Chat" screen recipe (bubbles, AI card, composer).
- `AGENTS.md`: note that a tab-only module has no manifest.

## Calls made while checking the design (not asked of the user)

- `trace_id`: `expo-crypto` is not installed. Use a small v4 uuid generator in the module (as the web does); the id only links a send to its progress, it is not a secret.
- Icons: the design system has no microphone or history icon. Add `mic` (lucide `Mic`) and `history` (lucide `History`) to `src/shared/ui/icon/icon.tsx`, so the history button uses `history`, not `list`.
- Keyboard: no keyboard library is installed. Use React Native's `KeyboardAvoidingView` before adding one.

## Left to the builder

- Keyboard handling (`KeyboardAvoidingView` or an installed keyboard library) and exact list scrolling (inverted list or scroll to end).
- Exact sizes of bubbles, avatar and chips within the tokens.
- Whether the session list in the sheet uses `ListRow` with a delete action or a long press.
