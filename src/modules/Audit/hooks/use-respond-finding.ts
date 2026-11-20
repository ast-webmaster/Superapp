import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';
import type { FindingResponseInput } from '../types';

/**
 * Saves the auditee response and due date of one finding. The findings list then shows the
 * server's copy of that finding; the card's counts and the waiting count reload.
 */
export function useRespondFinding(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...auditKeys.part(uuid, 'findings'), 'respond'],
    mutationFn: (input: FindingResponseInput) => auditApi.respond(uuid, input),
    onSuccess: (finding) => {
      queryClient.setQueryData(
        auditKeys.part(uuid, 'findings'),
        (current: Awaited<ReturnType<typeof auditApi.findings>> | undefined) =>
          current && {
            ...current,
            items: current.items.map((item) => (item.id === finding.id ? finding : item)),
          },
      );
      // The answered count in the findings meta and on the card changed too.
      void queryClient.invalidateQueries({ queryKey: auditKeys.part(uuid, 'findings') });
      void queryClient.invalidateQueries({ queryKey: auditKeys.detail(uuid), exact: true });
      void queryClient.invalidateQueries({ queryKey: auditKeys.actionCount() });
    },
    onError: (error) => {
      // The card may have moved on (for example it is no longer awaiting follow up).
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: auditKeys.detail(uuid) });
    },
  });
}
