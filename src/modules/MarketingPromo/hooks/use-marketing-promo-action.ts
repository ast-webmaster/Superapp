import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { marketingPromoApi } from '../api/marketingPromoApi';
import { marketingPromoKeys } from '../api/marketingPromoKeys';
import type { MarketingPromoActionInput, MarketingPromoKind } from '../types';

/**
 * Approve, reject, send back or cancel one promo. Nothing changes on screen until the server
 * answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function useMarketingPromoAction(kind: MarketingPromoKind, uuid: string) {
  const queryClient = useQueryClient();
  const detailKey = marketingPromoKeys.detail(kind, uuid);

  return useMutation({
    mutationKey: [...detailKey, 'action'],
    mutationFn: (input: MarketingPromoActionInput) => marketingPromoApi.act(kind, uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(detailKey, detail);
      // The promo moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: marketingPromoKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // promo changed or the action went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: marketingPromoKeys.lists() });
    },
  });
}
