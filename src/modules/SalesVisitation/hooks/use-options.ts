import { useQuery } from '@tanstack/react-query';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';

/**
 * Purposes and brand categories for the form, and the panel rules the check-in screens explain.
 * One short list, so every screen shares the same cached copy.
 */
export function useSalesVisitationOptions() {
  return useQuery({
    queryKey: salesVisitationKeys.options(),
    queryFn: ({ signal }) => salesVisitationApi.options(signal),
  });
}
