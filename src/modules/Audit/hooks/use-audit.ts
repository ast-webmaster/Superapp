import { useQuery } from '@tanstack/react-query';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';

export function useAudit(uuid: string) {
  return useQuery({
    queryKey: auditKeys.detail(uuid),
    queryFn: ({ signal }) => auditApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
