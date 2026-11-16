import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { marketingActivityApi } from '../api/marketingActivityApi';
import { marketingActivityKeys } from '../api/marketingActivityKeys';
import type { MarketingActivityActionInput, MarketingActivityKind } from '../types';

/**
 * Approve, reject, send back or advance one activity. Nothing changes on screen until the server
 * answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function useMarketingActivityAction(kind: MarketingActivityKind, uuid: string) {
  const queryClient = useQueryClient();
  const detailKey = marketingActivityKeys.detail(kind, uuid);

  return useMutation({
    mutationKey: [...detailKey, 'action'],
    mutationFn: (input: MarketingActivityActionInput) =>
      marketingActivityApi.act(kind, uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(detailKey, detail);
      // The activity moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: marketingActivityKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // activity changed or the action went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: marketingActivityKeys.lists() });
    },
  });
}
