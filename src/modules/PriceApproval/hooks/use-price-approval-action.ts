import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { priceApprovalApi } from '../api/priceApprovalApi';
import { priceApprovalKeys } from '../api/priceApprovalKeys';
import type { PriceApprovalActionInput } from '../types';

/**
 * Approve, reject, hold or close one request. Nothing changes on screen until the server
 * answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function usePriceApprovalAction(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...priceApprovalKeys.detail(uuid), 'action'],
    mutationFn: (input: PriceApprovalActionInput) => priceApprovalApi.act(uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(priceApprovalKeys.detail(uuid), detail);
      // The request moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: priceApprovalKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // request changed or the action went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: priceApprovalKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: priceApprovalKeys.lists() });
    },
  });
}
