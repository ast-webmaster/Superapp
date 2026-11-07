import { fetch } from 'expo/fetch';

import { env } from '@/core/config';
import { AppError, type FieldErrors } from '@/core/errors';

type Query = Record<string, string | number | boolean | undefined>;

export type RequestOptions = {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
};

type LaravelErrorBody = { message?: string; errors?: FieldErrors };

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
  const url = new URL(`${env.apiUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
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
    const body: LaravelErrorBody = await response.json().catch(() => ({}));
    // A 401 on a request that carried no token is a failed login, not an expired session.
    if (response.status === 401 && accessToken) onUnauthorized?.();
    throw AppError.fromStatus(
      response.status,
      body.message ?? `Request failed (${response.status})`,
      body.errors,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('DELETE', path, options),
};
