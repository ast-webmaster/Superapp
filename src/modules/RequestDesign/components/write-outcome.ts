import { toAppError } from '@/core/errors';
import type { AlertTone } from '@/shared/ui';

import { submitFailureMessage } from '../create/draft';

/**
 * What to tell the user about a write the server refused or never confirmed. A 422 says which
 * field is wrong; a 409 means the document moved on; a lost connection leaves the outcome unknown,
 * so the user is told to check before trying again.
 */
export function failureOutcome(error: unknown): { tone: AlertTone; message: string } {
  const failure = toAppError(error);
  if (failure.code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This request changed before your action was saved. Review the latest version.',
    };
  }
  if (failure.code === 'network' || failure.code === 'timeout' || failure.code === 'server') {
    return {
      tone: 'danger',
      message: 'Could not confirm your action. Check the status before you try again.',
    };
  }
  return { tone: 'danger', message: submitFailureMessage(failure) };
}
