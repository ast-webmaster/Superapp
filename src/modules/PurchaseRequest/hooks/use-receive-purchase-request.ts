import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';

/**
 * Receive items of one request. Nothing changes on screen until the server answers: the detail
 * then shows the server's copy, never a status guessed locally. Never retried (see query-client);
 * the server also refuses an item that was already received with 409.
 */
export function useReceivePurchaseRequest(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...purchaseRequestKeys.detail(uuid), 'receive'],
    mutationFn: (itemIds: number[]) => purchaseRequestApi.receive(uuid, itemIds),
    onSuccess: (detail) => {
      queryClient.setQueryData(purchaseRequestKeys.detail(uuid), detail);
      // The request may move to RECEIVED, which changes the status filters. Not awaited.
      void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean an item was
      // received already or the request went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  });
}
