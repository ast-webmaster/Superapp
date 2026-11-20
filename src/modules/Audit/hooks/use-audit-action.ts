import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';
import type { AuditActionInput } from '../types';

/**
 * Start, submit, follow up, approve or reject one card. Nothing changes on screen until the
 * server answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client). This API has no `updated_at` check: the server re-checks the
 * status under a lock and refuses an action that no longer fits with 422.
 */
export function useAuditAction(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...auditKeys.detail(uuid), 'action'],
    mutationFn: (input: AuditActionInput) => auditApi.act(uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(auditKeys.detail(uuid), detail);
      // What the user may do in the parts follows the status, so they load again when opened.
      // Not awaited: the detail is already current.
      const detailKey = auditKeys.detail(uuid);
      void queryClient.invalidateQueries({
        queryKey: detailKey,
        predicate: (query) => query.queryKey.length > detailKey.length,
      });
      void queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: auditKeys.actionCount() });
    },
    onError: (error) => {
      // A 422 refused the action and changed nothing. Anything else (timeout, lost connection)
      // may mean it went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: auditKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: auditKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: auditKeys.actionCount() });
    },
  });
}
