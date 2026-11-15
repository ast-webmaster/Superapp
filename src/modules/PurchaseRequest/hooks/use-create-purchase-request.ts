import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';
import type { PurchaseRequestDraft } from '../types';

/**
 * Sends a new request. Nothing is shown as created until the server answers 201; the detail
 * then holds the server's copy (its number, status and total). Never retried (see query-client):
 * a lost connection leaves the outcome unknown, so the lists are read again either way.
 */
export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...purchaseRequestKeys.all, 'create'],
    mutationFn: (draft: PurchaseRequestDraft) => purchaseRequestApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(purchaseRequestKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a timeout or a lost connection the request may have gone
      // through, so the list is refreshed and the user checks it before sending again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  });
}
