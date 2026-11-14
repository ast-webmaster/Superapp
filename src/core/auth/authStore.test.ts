import { AppError } from '@/core/errors';

import { authApi } from './authApi';
import { SESSION_REFRESH_INTERVAL_MS, useAuthStore } from './authStore';
import type { SessionData } from './types';

jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));

jest.mock('@/core/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

jest.mock('./authApi', () => ({ authApi: { me: jest.fn(), login: jest.fn() } }));
jest.mock('./deviceName', () => ({ getDeviceName: async () => 'test-device' }));

const me = authApi.me as jest.Mock;
const login = authApi.login as jest.Mock;

const session = (id: number, permissions: string[]): SessionData => ({
  user: {
    id,
    name: `User ${id}`,
    email: `${id}@example.test`,
    profile_photo_path: null,
    profile_photo_url: '',
  },
  roles: ['Sales'],
  permissions,
});

let now = 1_000_000;

/** Signs in through the store, so the time of the last load is set the way the app sets it. */
async function signIn(id: number, permissions: string[]) {
  login.mockResolvedValueOnce({
    ...session(id, permissions),
    token: 't',
    expires_at: '2099-01-01',
  });
  await useAuthStore.getState().signIn({ email: 'a@b.c', password: 'p' });
}

beforeEach(() => {
  me.mockReset();
  login.mockReset();
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  useAuthStore.setState({ status: 'unauthenticated', user: null, roles: [], permissions: [] });
});

afterEach(() => jest.restoreAllMocks());

describe('refreshSession', () => {
  it('waits for the interval after the last load unless forced', async () => {
    await signIn(1, ['read_a']);
    me.mockResolvedValue(session(1, ['read_b']));

    await useAuthStore.getState().refreshSession();
    expect(me).not.toHaveBeenCalled();

    await useAuthStore.getState().refreshSession({ force: true });
    expect(me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().permissions).toEqual(['read_b']);

    now += SESSION_REFRESH_INTERVAL_MS - 1;
    await useAuthStore.getState().refreshSession();
    expect(me).toHaveBeenCalledTimes(1);

    now += 1;
    await useAuthStore.getState().refreshSession();
    expect(me).toHaveBeenCalledTimes(2);
  });

  it('shares one request between callers that overlap', async () => {
    await signIn(1, ['read_a']);
    let answer: (value: SessionData) => void = () => {};
    me.mockReturnValueOnce(new Promise<SessionData>((resolve) => (answer = resolve)));

    const first = useAuthStore.getState().refreshSession({ force: true });
    const second = useAuthStore.getState().refreshSession({ force: true });
    answer(session(1, ['read_b']));
    await Promise.all([first, second]);

    expect(me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().permissions).toEqual(['read_b']);
  });

  it('does nothing without a session', async () => {
    await useAuthStore.getState().refreshSession({ force: true });
    expect(me).not.toHaveBeenCalled();
  });

  it('ends the session when the account is inactive', async () => {
    await signIn(1, ['read_a']);
    me.mockRejectedValueOnce(new AppError('Suspended', 'forbidden'));

    await useAuthStore.getState().refreshSession({ force: true });

    expect(useAuthStore.getState()).toMatchObject({ status: 'unauthenticated', permissions: [] });
  });

  it('keeps the session when the server cannot be reached', async () => {
    await signIn(1, ['read_a']);
    me.mockRejectedValueOnce(new AppError('Offline', 'network'));

    await useAuthStore.getState().refreshSession({ force: true });

    expect(useAuthStore.getState()).toMatchObject({
      status: 'authenticated',
      permissions: ['read_a'],
    });
  });

  it('drops an answer that arrives after another user signed in', async () => {
    await signIn(1, ['read_a']);
    let answer: (value: SessionData) => void = () => {};
    me.mockReturnValueOnce(new Promise<SessionData>((resolve) => (answer = resolve)));

    const pending = useAuthStore.getState().refreshSession({ force: true });
    await useAuthStore.getState().clearSession();
    await signIn(2, ['read_c']);
    answer(session(1, ['read_b']));
    await pending;

    expect(useAuthStore.getState()).toMatchObject({ user: { id: 2 }, permissions: ['read_c'] });
  });
});
