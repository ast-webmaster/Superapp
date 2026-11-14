import { act, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/core/auth';
import { secureStorage } from '@/core/storage';

import { useFavoriteAppsStore } from './favorite-apps-store';

// The auth store reads the API url from the environment at import time; the API is not under test here.
jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));

jest.mock('@/core/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

const get = secureStorage.get as jest.Mock;
const set = secureStorage.set as jest.Mock;

const signIn = (id: number) =>
  useAuthStore.setState({
    status: 'authenticated',
    user: {
      id,
      name: `User ${id}`,
      email: `${id}@example.test`,
      profile_photo_path: null,
      profile_photo_url: '',
    },
  });
const signOut = () => useAuthStore.setState({ status: 'unauthenticated', user: null });

beforeEach(() => {
  signOut();
  get.mockReset().mockResolvedValue(null);
  set.mockReset().mockResolvedValue(undefined);
});

it('is not ready, with no choice made, until the saved list is read', async () => {
  signIn(1);

  expect(useFavoriteAppsStore.getState()).toMatchObject({ ready: false, ids: null });
  await waitFor(() => expect(useFavoriteAppsStore.getState().ready).toBe(true));
  expect(useFavoriteAppsStore.getState().ids).toBeNull();
  expect(get).toHaveBeenCalledWith('favorite_apps_1');
});

it('restores the list the user saved on this device', async () => {
  get.mockResolvedValue(JSON.stringify(['b', 'a']));
  signIn(1);

  await waitFor(() => expect(useFavoriteAppsStore.getState().ids).toEqual(['b', 'a']));
});

it('treats unreadable storage as no choice made', async () => {
  get.mockResolvedValue('{not json');
  signIn(1);

  await waitFor(() => expect(useFavoriteAppsStore.getState().ready).toBe(true));
  expect(useFavoriteAppsStore.getState().ids).toBeNull();
});

it('saves under the signed-in user and keeps an empty list as a real choice', async () => {
  signIn(7);
  await waitFor(() => expect(useFavoriteAppsStore.getState().ready).toBe(true));

  act(() => useFavoriteAppsStore.getState().save([]));

  expect(useFavoriteAppsStore.getState().ids).toEqual([]);
  expect(set).toHaveBeenCalledWith('favorite_apps_7', '[]');
});

it('forgets the list when the session ends, so the next user starts clean', async () => {
  get.mockResolvedValue(JSON.stringify(['a']));
  signIn(1);
  await waitFor(() => expect(useFavoriteAppsStore.getState().ids).toEqual(['a']));

  signOut();

  expect(useFavoriteAppsStore.getState()).toMatchObject({ ready: false, ids: null });
});

it('ignores a read that finishes after the user changed', async () => {
  let finish: (value: string) => void = () => {};
  get.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
  signIn(1);
  signOut();

  finish(JSON.stringify(['late']));
  await act(async () => {});

  expect(useFavoriteAppsStore.getState()).toMatchObject({ ready: false, ids: null });
});
