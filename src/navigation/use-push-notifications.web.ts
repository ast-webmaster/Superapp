/**
 * Web variant (Metro picks `.web.ts` on web). expo-notifications has no web support for
 * `useLastNotificationResponse`, which throws on mount, so the web app does nothing here.
 */
export function usePushNotifications(): void {}
