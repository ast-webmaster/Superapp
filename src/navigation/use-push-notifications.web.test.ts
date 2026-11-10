import { renderHook } from '@testing-library/react-native';

import { usePushNotifications } from './use-push-notifications.web';

jest.mock('expo-notifications', () => {
  const unavailable = () => {
    throw new Error('expo-notifications is not available on web');
  };
  return new Proxy({}, { get: () => unavailable });
});

describe('usePushNotifications (web)', () => {
  it('is a no-op that never touches expo-notifications', () => {
    expect(() => renderHook(() => usePushNotifications())).not.toThrow();
  });
});
