import { useQuery } from '@tanstack/react-query';

import { priceApprovalApi } from '../api/priceApprovalApi';
import { priceApprovalKeys } from '../api/priceApprovalKeys';

export function usePriceApproval(uuid: string) {
  return useQuery({
    queryKey: priceApprovalKeys.detail(uuid),
    queryFn: ({ signal }) => priceApprovalApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
