import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';
import type { SalesVisitationDraft } from '../types';

/**
 * Plans a new visit, or with `edit` changes one. `resultOnly` is a visit already checked in, where
 * the server accepts only the result. Nothing is shown as saved until the server answers; the
 * detail then holds the server's copy. Never retried (see query-client): a lost connection leaves
 * the outcome unknown, so the list is read again and the user checks it before sending a second time.
 */
export function useSaveSalesVisitation(edit?: { uuid: string; resultOnly: boolean }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...salesVisitationKeys.all, edit ? 'edit' : 'create', edit?.uuid],
    mutationFn: (draft: SalesVisitationDraft) =>
      edit
        ? salesVisitationApi.update(edit.uuid, draft, edit.resultOnly)
        : salesVisitationApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(salesVisitationKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
    },
    onError: (error) => {
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.lists() });
      if (edit) {
        void queryClient.invalidateQueries({ queryKey: salesVisitationKeys.detail(edit.uuid) });
      }
    },
  });
}
