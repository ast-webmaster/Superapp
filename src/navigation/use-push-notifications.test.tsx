import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { useAuthStatus } from '@/core/auth';
import { registerForPushNotifications } from '@/core/notifications';

import { usePushNotifications } from './use-push-notifications';

jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  useLastNotificationResponse: jest.fn(),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/core/auth', () => ({ useAuthStatus: jest.fn() }));
jest.mock('@/core/api', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));
jest.mock('./registry', () => ({
  moduleManifests: [
    {
      id: 'price-approval',
      title: 'Price Approval',
      description: '',
      route: '/price-approval',
      detailRoute: (uuid: string) => `/price-approval/${uuid}`,
    },
  ],
}));
jest.mock('@/core/notifications', () => ({ registerForPushNotifications: jest.fn() }));

const notifications = jest.mocked(Notifications);
const status = jest.mocked(useAuthStatus);
const register = jest.mocked(registerForPushNotifications);
const push = jest.mocked(router.push);

// Captured at import time: beforeEach clears the mock calls.
const handlerConfig = jest.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0];

const DEFAULT = 'expo.modules.notifications.actions.DEFAULT';
const UUID = '11111111-2222-3333-4444-555555555555';

function tap(
  id: string,
  data: unknown = { module: 'price-approval', doc_uuid: UUID },
  action = DEFAULT,
) {
  return {
    actionIdentifier: action,
    notification: { request: { identifier: id, content: { data } } },
  };
}

let queryClient: QueryClient;
let invalidate: jest.SpyInstance;
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient();
  invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  notifications.useLastNotificationResponse.mockReturnValue(undefined);
  notifications.addNotificationReceivedListener.mockReturnValue({ remove: jest.fn() } as never);
  status.mockReturnValue('authenticated');
});

describe('usePushNotifications', () => {
  it('shows foreground pushes as banner and list without sound or badge', async () => {
    await expect(handlerConfig?.handleNotification({} as never)).resolves.toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  it('registers the push token once when authenticated and not while restoring or signed out', async () => {
    status.mockReturnValue('restoring');
    const { rerender } = await renderHook(() => usePushNotifications(), { wrapper });
    status.mockReturnValue('unauthenticated');
    await rerender({});
    expect(register).not.toHaveBeenCalled();

    status.mockReturnValue('authenticated');
    await rerender({});
    await rerender({});
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('invalidates the inbox when a notification arrives', async () => {
    const remove = jest.fn();
    notifications.addNotificationReceivedListener.mockReturnValue({ remove } as never);
    const { unmount } = await renderHook(() => usePushNotifications(), { wrapper });
    const listener = notifications.addNotificationReceivedListener.mock.calls[0]?.[0];
    listener?.({} as never);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['inbox'] });
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('opens the document when a notification is tapped while authenticated', async () => {
    notifications.useLastNotificationResponse.mockReturnValue(tap('n1') as never);
    const { rerender } = await renderHook(() => usePushNotifications(), { wrapper });
    await rerender({});
    await rerender({});
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(`/price-approval/${UUID}`);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['inbox'] });
  });

  it('waits for the session before opening a document from a cold start', async () => {
    notifications.useLastNotificationResponse.mockReturnValue(tap('n1') as never);
    status.mockReturnValue('restoring');
    const { rerender } = await renderHook(() => usePushNotifications(), { wrapper });
    expect(push).not.toHaveBeenCalled();

    status.mockReturnValue('authenticated');
    await rerender({});
    await rerender({});
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('ignores a tap while signed out and does not replay it after the next sign-in', async () => {
    notifications.useLastNotificationResponse.mockReturnValue(tap('n1') as never);
    status.mockReturnValue('unauthenticated');
    const { rerender } = await renderHook(() => usePushNotifications(), { wrapper });
    expect(push).not.toHaveBeenCalled();

    status.mockReturnValue('authenticated');
    await rerender({});
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores a tap with an unknown module', async () => {
    notifications.useLastNotificationResponse.mockReturnValue(
      tap('n1', { module: 'nope', doc_uuid: UUID }) as never,
    );
    await renderHook(() => usePushNotifications(), { wrapper });
    expect(push).not.toHaveBeenCalled();
  });

  it('ignores a non-default action', async () => {
    notifications.useLastNotificationResponse.mockReturnValue(
      tap('n1', undefined, 'other') as never,
    );
    await renderHook(() => usePushNotifications(), { wrapper });
    expect(push).not.toHaveBeenCalled();
  });
});
