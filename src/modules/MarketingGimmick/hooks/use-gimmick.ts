import { useQuery } from '@tanstack/react-query';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickFlow } from '../types';

export function useGimmick(flow: GimmickFlow, uuid: string) {
  return useQuery({
    queryKey: marketingGimmickKeys.detail(flow, uuid),
    queryFn: ({ signal }) => marketingGimmickApi.detail(flow, uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
