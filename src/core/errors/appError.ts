export type AppErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
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
  if (status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError(error instanceof Error ? error.message : 'Something went wrong', 'unknown');
}

/** 4xx responses will not succeed on retry; network and 5xx failures might. */
export function isRetryable(error: unknown): boolean {
  return error instanceof AppError && (error.code === 'network' || error.code === 'server');
}
