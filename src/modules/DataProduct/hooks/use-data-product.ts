import { useQuery } from '@tanstack/react-query';

import { dataProductApi } from '../api/dataProductApi';
import { dataProductKeys } from '../api/dataProductKeys';

export function useDataProduct(id: string) {
  return useQuery({
    queryKey: dataProductKeys.detail(id),
    queryFn: ({ signal }) => dataProductApi.detail(id, signal),
  });
}
