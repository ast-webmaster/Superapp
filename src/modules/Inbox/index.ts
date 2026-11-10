// Public interface of the Inbox module. Other code imports only from here.
// Unlike a business module it has no manifest: the Inbox is a tab, not a tile.
export { inboxKeys } from './api/inboxKeys';
export { InboxRow, InboxRowsSkeleton, type InboxRowProps } from './components/inbox-row';
export { useInbox, useInboxTotal, useRefreshInboxOnFocus } from './hooks/use-inbox';
export type { InboxItem } from './types';
