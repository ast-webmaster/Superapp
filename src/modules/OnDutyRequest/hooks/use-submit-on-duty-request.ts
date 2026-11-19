import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';
import type { OnDutyRequestDraft } from '../types';

/**
 * Sends a new request, or with `uuid` the corrected content of one that was sent back. Nothing is
 * shown as saved until the server answers; the detail then holds the server's copy (its number,
 * status and totals). Never retried (see query-client): a lost connection leaves the outcome
 * unknown, so the server's version is read again either way.
 */
export function useSubmitOnDutyRequest(uuid?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...onDutyRequestKeys.all, uuid ? 'resubmit' : 'create', uuid],
    mutationFn: (draft: OnDutyRequestDraft) =>
      uuid ? onDutyRequestApi.resubmit(uuid, draft) : onDutyRequestApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(onDutyRequestKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a conflict, a timeout or a lost connection the document may
      // have changed or been saved, so it is read again and the user checks it before sending again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
      if (uuid) void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.detail(uuid) });
    },
  });
}
