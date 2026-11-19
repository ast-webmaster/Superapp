import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';
import type { DeclarationDraft } from '../types';

/**
 * Sends the declaration (the real costs of a finished trip) of one document. The detail then shows
 * the server's copy. Never retried (see query-client), and read again after anything but a 422,
 * because a timeout or lost connection may still have saved it.
 */
export function useSubmitDeclaration(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...onDutyRequestKeys.detail(uuid), 'declare'],
    mutationFn: (draft: DeclarationDraft) => onDutyRequestApi.declare(uuid, draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(onDutyRequestKeys.detail(uuid), detail);
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
    },
    onError: (error) => {
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: onDutyRequestKeys.lists() });
    },
  });
}
