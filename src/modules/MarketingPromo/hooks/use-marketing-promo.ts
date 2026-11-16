import { useQuery } from '@tanstack/react-query';

import { marketingPromoApi } from '../api/marketingPromoApi';
import { marketingPromoKeys } from '../api/marketingPromoKeys';
import type { MarketingPromoKind } from '../types';

export function useMarketingPromo(kind: MarketingPromoKind, uuid: string) {
  return useQuery({
    queryKey: marketingPromoKeys.detail(kind, uuid),
    queryFn: ({ signal }) => marketingPromoApi.detail(kind, uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
