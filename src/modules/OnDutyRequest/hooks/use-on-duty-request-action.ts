import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';
import type { OnDutyRequestActionInput } from '../types';

/**
 * Approve, reject, send back or cancel one document. Nothing changes on screen until the server
 * answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function useOnDutyRequestAction(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...onDutyRequestKeys.detail(uuid), 'action'],
    mutationFn: (input: OnDutyRequestActionInput) => onDutyRequestApi.act(uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(onDutyRequestKeys.detail(uuid), detail);
      // The document moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // document changed or the action went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
    },
  });
}
