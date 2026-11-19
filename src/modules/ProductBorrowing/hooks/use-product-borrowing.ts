import { useQuery } from '@tanstack/react-query';

import { productBorrowingApi } from '../api/productBorrowingApi';
import { productBorrowingKeys } from '../api/productBorrowingKeys';

export function useProductBorrowing(uuid: string) {
  return useQuery({
    queryKey: productBorrowingKeys.detail(uuid),
    queryFn: ({ signal }) => productBorrowingApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
