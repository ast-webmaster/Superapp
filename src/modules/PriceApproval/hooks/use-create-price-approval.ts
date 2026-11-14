import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { priceApprovalApi } from '../api/priceApprovalApi';
import { priceApprovalKeys } from '../api/priceApprovalKeys';
import type { PriceApprovalDraft } from '../types';

/**
 * Sends a new request. Nothing is shown as created until the server answers 201; the detail
 * then holds the server's copy (its number, status and totals). Never retried (see query-client):
 * a lost connection leaves the outcome unknown, so the lists are read again either way.
 */
export function useCreatePriceApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...priceApprovalKeys.all, 'create'],
    mutationFn: (draft: PriceApprovalDraft) => priceApprovalApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(priceApprovalKeys.detail(detail.pa_uuid), detail);
      void queryClient.invalidateQueries({ queryKey: priceApprovalKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a timeout or a lost connection the request may have gone
      // through, so the list is refreshed and the user checks it before sending again.
      const code = toAppError(error).code;
      if (code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: priceApprovalKeys.lists() });
    },
  });
}
