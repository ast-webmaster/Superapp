import { toAppError } from '@/core/errors';

/** The first field error when the server names one (a refused file, a field too long), else its message. */
export function errorMessage(error: unknown): string {
  const { fieldErrors, message } = toAppError(error);
  const first = fieldErrors ? Object.values(fieldErrors)[0]?.[0] : undefined;
  return first ?? message;
}
