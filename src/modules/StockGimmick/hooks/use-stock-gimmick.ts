import { useQuery } from '@tanstack/react-query';

import { stockGimmickApi } from '../api/stockGimmickApi';
import { stockGimmickKeys } from '../api/stockGimmickKeys';

export function useStockGimmick(id: string) {
  return useQuery({
    queryKey: stockGimmickKeys.detail(id),
    queryFn: ({ signal }) => stockGimmickApi.detail(id, signal),
  });
}
