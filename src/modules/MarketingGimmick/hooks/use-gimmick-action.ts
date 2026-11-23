import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickActionInput, GimmickFlow } from '../types';

/**
 * An action on one existing document. Nothing changes on screen until the server answers: the
 * detail then shows the server's copy, never a status guessed locally. Never retried (see
 * query-client); the server also refuses a repeat with 409.
 */
export function useGimmickAction(flow: GimmickFlow, uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...marketingGimmickKeys.detail(flow, uuid), 'action'],
    mutationFn: (input: GimmickActionInput) => marketingGimmickApi.act(flow, uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(marketingGimmickKeys.detail(flow, uuid), detail);
      // The document moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.lists(flow) });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // document changed or the action went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.detail(flow, uuid) });
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.lists(flow) });
    },
  });
}
