import { useQuery } from '@tanstack/react-query';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';

export function useSalesVisitation(uuid: string) {
  return useQuery({
    queryKey: salesVisitationKeys.detail(uuid),
    queryFn: ({ signal }) => salesVisitationApi.detail(uuid, signal),
    // The actions offered depend on the status and on today's date, so opening the screen always
    // asks the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
