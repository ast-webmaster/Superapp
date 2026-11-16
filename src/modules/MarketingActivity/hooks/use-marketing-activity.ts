import { useQuery } from '@tanstack/react-query';

import { marketingActivityApi } from '../api/marketingActivityApi';
import { marketingActivityKeys } from '../api/marketingActivityKeys';
import type { MarketingActivityKind } from '../types';

export function useMarketingActivity(kind: MarketingActivityKind, uuid: string) {
  return useQuery({
    queryKey: marketingActivityKeys.detail(kind, uuid),
    queryFn: ({ signal }) => marketingActivityApi.detail(kind, uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
