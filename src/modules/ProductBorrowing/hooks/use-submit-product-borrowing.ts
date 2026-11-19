import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { productBorrowingApi } from '../api/productBorrowingApi';
import { productBorrowingKeys } from '../api/productBorrowingKeys';
import type { ProductBorrowingDraft } from '../types';

/**
 * Sends a new document, or with `resubmit` the corrected content of one that was sent back
 * (`updatedAt` is the version the form was filled from). Nothing is shown as saved until the
 * server answers; the detail then holds the server's copy (its number, status and stock).
 * Never retried (see query-client): a lost connection leaves the outcome unknown, so the
 * server's version is read again either way.
 */
export function useSubmitProductBorrowing(resubmit?: { uuid: string; updatedAt: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...productBorrowingKeys.all, resubmit ? 'resubmit' : 'create', resubmit?.uuid],
    mutationFn: (draft: ProductBorrowingDraft) =>
      resubmit
        ? productBorrowingApi.resubmit(resubmit.uuid, draft, resubmit.updatedAt)
        : productBorrowingApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(productBorrowingKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: productBorrowingKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a conflict, a timeout or a lost connection the document may
      // have changed or been saved, so it is read again and the user checks it before sending again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: productBorrowingKeys.lists() });
      if (resubmit) {
        void queryClient.invalidateQueries({
          queryKey: productBorrowingKeys.detail(resubmit.uuid),
        });
      }
    },
  });
}
