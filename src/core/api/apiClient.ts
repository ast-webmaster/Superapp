import { fetch } from 'expo/fetch';

import { env } from '@/core/config';
import { AppError, type FieldErrors } from '@/core/errors';

type Query = Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

/** Success envelope of every DigitalApproval endpoint. `meta` is pagination for lists, else empty. */
export type ApiSuccess<T, M = null> = { success: true; message: string; data: T; meta: M };

type ApiErrorBody = { message?: string; errors?: FieldErrors };

/** Version prefix of the API; `env.apiUrl` already ends at `/api`. */
const API_VERSION = '/v1';

// The auth layer owns the token and the sign-out policy; the client only holds what it
// needs to send a request. Injecting them keeps core/api free of any core/auth import.
let accessToken: string | null = null;
let onUnauthorized: (() => void) | undefined;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${env.apiUrl}${API_VERSION}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<T, M>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiSuccess<T, M>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AppError('Cannot reach the server. Check your connection.', 'network');
  }

  if (!response.ok) {
    const body: ApiErrorBody = await response.json().catch(() => ({}));
    // A 401 on a request that carried no token is a failed login, not an expired session.
    if (response.status === 401 && accessToken) onUnauthorized?.();
    throw AppError.fromStatus(
      response.status,
      body.message ?? `Request failed (${response.status})`,
      body.errors,
    );
  }

  return (await response.json()) as ApiSuccess<T, M>;
}

export const apiClient = {
  get: <T, M = null>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T, M>('GET', path, options),
  post: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T, M>('POST', path, { ...options, body }),
  put: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T, M>('PUT', path, { ...options, body }),
  patch: <T, M = null>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T, M>('PATCH', path, { ...options, body }),
  delete: <T, M = null>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T, M>('DELETE', path, options),
};
