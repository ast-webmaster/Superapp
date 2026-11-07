export type AppErrorCode =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  /** The record changed on the server since the client read it (409). */
  | 'conflict'
  | 'validation'
  | 'rate_limited'
  | 'server'
  | 'unknown';

/** Laravel validation errors: field name -> messages. */
export type FieldErrors = Record<string, string[]>;

/** The single error type the app surfaces from the API layer. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: AppErrorCode,
    readonly status?: number,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromStatus(status: number, message: string, fieldErrors?: FieldErrors): AppError {
    return new AppError(message, codeFromStatus(status), status, fieldErrors);
  }
}

function codeFromStatus(status: number): AppErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError(error instanceof Error ? error.message : 'Something went wrong', 'unknown');
}

const TRANSIENT: readonly AppErrorCode[] = ['network', 'timeout', 'server'];

/** 4xx responses will not succeed on retry; network, timeout and 5xx failures might. */
export function isRetryable(error: unknown): boolean {
  return error instanceof AppError && TRANSIENT.includes(error.code);
}
