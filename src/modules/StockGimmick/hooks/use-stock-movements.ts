import { useQuery } from '@tanstack/react-query';

import { stockGimmickApi } from '../api/stockGimmickApi';
import { stockGimmickKeys } from '../api/stockGimmickKeys';

/** Track Stock of one row. Separate from the detail so a failed history never hides the stock. */
export function useStockMovements(id: string) {
  return useQuery({
    queryKey: stockGimmickKeys.movements(id),
    queryFn: ({ signal }) => stockGimmickApi.movements(id, signal),
  });
}
