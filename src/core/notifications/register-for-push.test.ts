import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { apiClient } from '../api';
import { registerForPushNotifications } from './register-for-push';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'proj-1' } } }, easConfig: undefined },
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('../api', () => ({ apiClient: { post: jest.fn() } }));

const notifications = jest.mocked(Notifications);
const post = jest.mocked(apiClient.post);
const device = Device as { isDevice: boolean };

beforeEach(() => {
  jest.clearAllMocks();
  device.isDevice = true;
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
  notifications.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
  notifications.getExpoPushTokenAsync.mockResolvedValue({
    type: 'expo',
    data: 'ExponentPushToken[abc]',
  });
  post.mockResolvedValue({ data: null } as never);
});

describe('registerForPushNotifications', () => {
  it('registers the token with the platform once permission is granted', async () => {
    await registerForPushNotifications();

    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
    expect(post).toHaveBeenCalledWith('/me/device-tokens', {
      token: 'ExponentPushToken[abc]',
      platform: 'android',
    });
  });

  it('creates the Android channel before asking for the token', async () => {
    await registerForPushNotifications();

    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
      name: 'General',
      importance: 4,
    });
    const [channelOrder = Infinity] = notifications.setNotificationChannelAsync.mock.invocationCallOrder;
    const [tokenOrder = 0] = notifications.getExpoPushTokenAsync.mock.invocationCallOrder;
    expect(channelOrder).toBeLessThan(tokenOrder);
  });

  it('asks for permission when not yet granted and stops when denied', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);

    await registerForPushNotifications();

    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('does nothing on a simulator', async () => {
    device.isDevice = false;

    await registerForPushNotifications();

    expect(notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('swallows errors from the token request and the API', async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValueOnce(new Error('offline'));
    await expect(registerForPushNotifications()).resolves.toBeUndefined();

    post.mockRejectedValueOnce(new Error('500'));
    await expect(registerForPushNotifications()).resolves.toBeUndefined();
  });
});
