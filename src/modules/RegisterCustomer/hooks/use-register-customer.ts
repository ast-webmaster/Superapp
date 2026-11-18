import { useQuery } from '@tanstack/react-query';

import { registerCustomerApi } from '../api/registerCustomerApi';
import { registerCustomerKeys } from '../api/registerCustomerKeys';

export function useRegisterCustomer(uuid: string) {
  return useQuery({
    queryKey: registerCustomerKeys.detail(uuid),
    queryFn: ({ signal }) => registerCustomerApi.detail(uuid, signal),
    // The actions offered depend on the current stage, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
