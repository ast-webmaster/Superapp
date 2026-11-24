import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';

/** Deletes a planned visit. The lists are read again only after the server agrees. */
export function useDeleteSalesVisitation(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...salesVisitationKeys.detail(uuid), 'delete'],
    mutationFn: () => salesVisitationApi.remove(uuid),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
    },
    onError: (error) => {
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
    },
  });
}
