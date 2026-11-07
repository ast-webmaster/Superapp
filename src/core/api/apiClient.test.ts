import { fetch } from 'expo/fetch';

import { AppError } from '@/core/errors';

import { apiClient, setAccessToken, setUnauthorizedHandler } from './apiClient';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));
jest.mock('@/core/config', () => ({ env: { apiUrl: 'https://example.test/api' } }));

const fetchMock = fetch as unknown as jest.Mock;

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });
}

beforeEach(() => {
  fetchMock.mockReset();
  setAccessToken(null);
  setUnauthorizedHandler(undefined);
});

describe('apiClient', () => {
  it('calls the versioned endpoint and returns the whole envelope', async () => {
    setAccessToken('tok');
    const envelope = { success: true, message: 'ok', data: [1], meta: { current_page: 1 } };
    respond(200, envelope);

    const result = await apiClient.get('/price-approval', { query: { status: 'AWAITING', page: 2 } });

    expect(result).toEqual(envelope);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.test/api/v1/price-approval?status=AWAITING&page=2');
    expect(init.headers).toMatchObject({ Accept: 'application/json', Authorization: 'Bearer tok' });
  });

  it('exposes 422 field errors and maps 429 to rate_limited', async () => {
    respond(422, { success: false, message: 'Validasi gagal', errors: { code: ['required'] } });
    await expect(apiClient.post('/login', {})).rejects.toMatchObject({
      code: 'validation',
      fieldErrors: { code: ['required'] },
    });

    respond(429, { success: false, message: 'Too Many Attempts.', errors: null });
    await expect(apiClient.post('/login', {})).rejects.toMatchObject({ code: 'rate_limited', status: 429 });
  });

  it('treats 401 as an expired session only when a token was sent', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    respond(401, { success: false, message: 'wrong password', errors: null });
    await expect(apiClient.post('/login', {})).rejects.toBeInstanceOf(AppError);
    expect(onUnauthorized).not.toHaveBeenCalled();

    setAccessToken('tok');
    respond(401, { success: false, message: 'Unauthenticated.', errors: null });
    await expect(apiClient.get('/me')).rejects.toMatchObject({ code: 'unauthorized' });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
