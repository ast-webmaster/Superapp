import { useQuery } from '@tanstack/react-query';

import { dataCustomerApi } from '../api/dataCustomerApi';
import { dataCustomerKeys } from '../api/dataCustomerKeys';

export function useDataCustomer(id: string) {
  return useQuery({
    queryKey: dataCustomerKeys.detail(id),
    queryFn: ({ signal }) => dataCustomerApi.detail(id, signal),
  });
}
