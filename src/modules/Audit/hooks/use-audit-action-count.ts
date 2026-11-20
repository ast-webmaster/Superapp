import { useQuery } from '@tanstack/react-query';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';

/** How many cards wait for the user. A failure just hides the count: it is a hint, not data. */
export function useAuditActionCount() {
  return useQuery({
    queryKey: auditKeys.actionCount(),
    queryFn: ({ signal }) => auditApi.actionCount(signal),
  });
}
