import { useQuery } from '@tanstack/react-query';

import { stockPenjualanApi } from '../api/stockPenjualanApi';
import { stockPenjualanKeys } from '../api/stockPenjualanKeys';

/** The category choices of the filter sheet. `enabled` holds the request until the sheet opens. */
export function useStockCategories(enabled: boolean) {
  return useQuery({
    queryKey: stockPenjualanKeys.categories(),
    queryFn: ({ signal }) => stockPenjualanApi.categories(signal),
    enabled,
  });
}
