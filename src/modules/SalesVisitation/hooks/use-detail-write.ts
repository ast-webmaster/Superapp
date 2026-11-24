import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { salesVisitationKeys } from '../api/salesVisitationKeys';
import type { SalesVisitationDetail } from '../types';

/**
 * A write to one existing visit that answers with the visit. Nothing changes on screen until the
 * server answers: the detail then shows the server's copy, never a status guessed locally. Never
 * retried (see query-client); the server also refuses a repeat (the status moved on, 422).
 */
export function useDetailWrite<Input>(
  uuid: string,
  name: string,
  write: (input: Input) => Promise<SalesVisitationDetail>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...salesVisitationKeys.detail(uuid), name],
    mutationFn: write,
    onSuccess: (detail) => {
      queryClient.setQueryData(salesVisitationKeys.detail(uuid), detail);
      // The visit moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
      // A newly saved location is offered to the next visit of that customer.
      void queryClient.invalidateQueries({
        queryKey: [...salesVisitationKeys.all, 'customer-locations'],
      });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (timeout, lost connection) may mean the write went
      // through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
    },
  });
}
