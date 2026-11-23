import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickDraft, GimmickFlow } from '../types';

/**
 * Sends a new document. Nothing is shown as saved until the server answers; the detail then
 * holds the server's copy (its number and status). Never retried (see query-client): a lost
 * connection leaves the outcome unknown, so the lists are read again and the user checks them
 * before sending a second time.
 */
export function useSubmitGimmick(flow: GimmickFlow) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...marketingGimmickKeys.all(flow), 'create'],
    mutationFn: (draft: GimmickDraft) => marketingGimmickApi.create(flow, draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(marketingGimmickKeys.detail(flow, detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.lists(flow) });
      // The document reserved or added stock, so the item picker's figures are old now.
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.lookups(flow) });
    },
    onError: (error) => {
      // A 422 saved nothing. After a timeout or a lost connection it may have been saved.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: marketingGimmickKeys.lists(flow) });
    },
  });
}
