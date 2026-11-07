import { fetch } from 'expo/fetch';

import { AppError } from '@/core/errors';

import { apiClient, REQUEST_TIMEOUT_MS, setAccessToken, setUnauthorizedHandler } from './apiClient';

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

    const result = await apiClient.get('/price-approval', {
      query: { status: 'AWAITING', page: 2 },
    });

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
    await expect(apiClient.post('/login', {})).rejects.toMatchObject({
      code: 'rate_limited',
      status: 429,
    });
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

  it('maps 409 to conflict', async () => {
    respond(409, { success: false, message: 'changed', errors: null });
    await expect(apiClient.post('/price-approval/x/actions', {})).rejects.toMatchObject({
      code: 'conflict',
      status: 409,
    });
  });

  describe('timeout', () => {
    // A fetch that never settles on its own, only when its signal aborts, like a stalled server.
    function hang() {
      fetchMock.mockImplementationOnce(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new Error('Aborted')));
          }),
      );
    }

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('fails a stalled request as timeout', async () => {
      hang();
      const result = apiClient.get('/me');
      jest.advanceTimersByTime(REQUEST_TIMEOUT_MS);
      await expect(result).rejects.toMatchObject({ code: 'timeout' });
    });

    it('passes a caller cancel through untouched, so React Query sees a cancellation', async () => {
      hang();
      const controller = new AbortController();
      const result = apiClient.get('/me', { signal: controller.signal });
      controller.abort();
      await expect(result).rejects.not.toBeInstanceOf(AppError);
    });
  });
});
