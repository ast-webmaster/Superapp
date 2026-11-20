import { focusManager } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as Updates from 'expo-updates';

import { useAppUpdate } from './use-app-update';

jest.mock('expo-updates', () => ({
  isEnabled: true,
  useUpdates: jest.fn(() => ({ isUpdatePending: false })),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

const check = jest.mocked(Updates.checkForUpdateAsync);
const fetchUpdate = jest.mocked(Updates.fetchUpdateAsync);

describe('useAppUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-20T10:00:00Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('downloads an update found when the app returns to the foreground', async () => {
    check.mockResolvedValue({ isAvailable: true } as Awaited<ReturnType<typeof check>>);
    await renderHook(() => useAppUpdate());

    await act(async () => focusManager.setFocused(false));
    await act(async () => focusManager.setFocused(true));

    expect(check).toHaveBeenCalledTimes(1);
    expect(fetchUpdate).toHaveBeenCalledTimes(1);
  });

  it('does not check again within the interval, and survives a failed check', async () => {
    check.mockRejectedValue(new Error('offline'));
    await renderHook(() => useAppUpdate());

    await act(async () => focusManager.setFocused(false));
    await act(async () => focusManager.setFocused(true));
    await act(async () => focusManager.setFocused(false));
    await act(async () => focusManager.setFocused(true));

    expect(check).toHaveBeenCalledTimes(1);
    expect(fetchUpdate).not.toHaveBeenCalled();

    jest.setSystemTime(new Date('2026-11-20T10:20:00Z'));
    await act(async () => focusManager.setFocused(false));
    await act(async () => focusManager.setFocused(true));

    expect(check).toHaveBeenCalledTimes(2);
  });
});
