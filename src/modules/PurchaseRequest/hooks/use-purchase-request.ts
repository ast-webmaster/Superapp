import { useQuery } from '@tanstack/react-query';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';

export function usePurchaseRequest(uuid: string) {
  return useQuery({
    queryKey: purchaseRequestKeys.detail(uuid),
    queryFn: ({ signal }) => purchaseRequestApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
