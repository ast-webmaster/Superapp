import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuthStatus } from '@/core/auth';
import { registerForPushNotifications } from '@/core/notifications';
import { inboxKeys } from '@/modules/Inbox';

import { resolveNotificationRoute } from './notification-route';
import { moduleManifests } from './registry';

// Show pushes that arrive while the app is open; the inbox refresh below covers the data.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Push notifications for the app shell: registers this device once per sign-in, refreshes the
 * inbox when a push arrives, and opens the document when one is tapped (including a cold start,
 * once the session is known).
 */
export function usePushNotifications(): void {
  const status = useAuthStatus();
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  // A tap is acted on once per notification, never replayed on re-render or a later sign-in.
  const handled = useRef(new Set<string>());

  const authenticated = status === 'authenticated';

  useEffect(() => {
    if (authenticated) void registerForPushNotifications();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    });
    return () => subscription.remove();
  }, [authenticated, queryClient]);

  useEffect(() => {
    if (!lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    if (status === 'restoring') return;

    const id = lastResponse.notification.request.identifier;
    if (handled.current.has(id)) return;
    handled.current.add(id);
    if (status !== 'authenticated') return;

    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    const route = resolveNotificationRoute(
      lastResponse.notification.request.content.data,
      moduleManifests,
    );
    if (route) router.push(route as Href);
  }, [lastResponse, status, queryClient]);
}
