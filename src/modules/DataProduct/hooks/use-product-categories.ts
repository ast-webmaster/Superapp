import { useQuery } from '@tanstack/react-query';

import { dataProductApi } from '../api/dataProductApi';
import { dataProductKeys } from '../api/dataProductKeys';

/** The category choices of the filter sheet. `enabled` holds the request until the sheet opens. */
export function useProductCategories(enabled: boolean) {
  return useQuery({
    queryKey: dataProductKeys.categories(),
    queryFn: ({ signal }) => dataProductApi.categories(signal),
    enabled,
  });
}
