import { fetch } from 'expo/fetch';

import { env } from '@/core/config';
import { AppError, type FieldErrors } from '@/core/errors';

type Query = Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Overrides `REQUEST_TIMEOUT_MS`, for a server that builds a file before it answers. */
  timeoutMs?: number;
};

/** Success envelope of every DigitalApproval endpoint. `meta` is pagination for lists, else empty. */
export type ApiSuccess<T, M = null> = { success: true; message: string; data: T; meta: M };

type ApiErrorBody = { message?: string; errors?: FieldErrors };

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

/** Version prefix of the API; `env.apiUrl` already ends at `/api`. */
const API_VERSION = '/v1';
/** A request that has not finished by then fails as `timeout` instead of spinning forever. */
export const REQUEST_TIMEOUT_MS = 20_000;

// The auth layer owns the token and the sign-out policy; the client only holds what it
// needs to send a request. Injecting them keeps core/api free of any core/auth import.
let accessToken: string | null = null;
let onUnauthorized: (() => void) | undefined;
let onForbidden: (() => void) | undefined;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

/** Called on a 403 to a signed-in request: the user's permissions may have changed on the server. */
export function setForbiddenHandler(handler: (() => void) | undefined) {
  onForbidden = handler;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${env.apiUrl}${API_VERSION}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<R>(
  method: string,
  path: string,
  options: RequestOptions,
  read: (response: FetchResponse) => Promise<R>,
): Promise<R> {
  // One signal for both the caller's cancel and the timeout. AbortSignal.any and
  // AbortSignal.timeout are not guaranteed on Hermes, so they are combined by hand.
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', cancel);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    return await send(method, path, options, controller.signal, read);
  } catch (error) {
    if (timedOut) throw new AppError('The server took too long to respond. Try again.', 'timeout');
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}

async function send<R>(
  method: string,
  path: string,
  options: RequestOptions,
  signal: AbortSignal,
  read: (response: FetchResponse) => Promise<R>,
): Promise<R> {
  // Errors are JSON even when the success body is a file.
  const headers: Record<string, string> = { Accept: 'application/json' };
  // A FormData body is sent as-is: fetch sets the multipart Content-Type with its boundary.
  const isForm = options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      signal,
    });
  } catch (error) {
    // Cancelled or timed out: request() decides which.
    if (signal.aborted) throw error;
    throw new AppError('Cannot reach the server. Check your connection.', 'network');
  }

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}));
    // A 401 on a request that carried no token is a failed login, not an expired session.
    if (response.status === 401 && accessToken) onUnauthorized?.();
    if (response.status === 403 && accessToken) onForbidden?.();
    throw AppError.fromStatus(
      response.status,
      body.message ?? `Request failed (${response.status})`,
      body.errors,
    );
  }

  return read(response);
}

const readJson = async <T, M>(response: FetchResponse) =>
  (await response.json()) as ApiSuccess<T, M>;

export const apiClient = {
  get: <T, M = null>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request('GET', path, options ?? {}, readJson<T, M>),
  post: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request('POST', path, { ...options, body }, readJson<T, M>),
  put: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request('PUT', path, { ...options, body }, readJson<T, M>),
  patch: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request('PATCH', path, { ...options, body }, readJson<T, M>),
  delete: <T, M = null>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request('DELETE', path, options ?? {}, readJson<T, M>),
  /** A GET whose success body is a file. Errors still arrive as the usual `AppError`. */
  getFile: async (path: string, options?: Omit<RequestOptions, 'body'>) =>
    new Uint8Array(await request('GET', path, options ?? {}, (response) => response.arrayBuffer())),
};
