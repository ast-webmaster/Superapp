import { useQuery } from '@tanstack/react-query';

import { priceApprovalApi } from '../api/priceApprovalApi';
import { priceApprovalKeys } from '../api/priceApprovalKeys';

/** `enabled` holds the request until a picker opens. A new search starts with no rows: the sheet shows a spinner, never the answer to older text. */
const options = {} as const;

export function useCustomerOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: priceApprovalKeys.customers(search),
    queryFn: ({ signal }) => priceApprovalApi.customers(search, signal),
    enabled,
    ...options,
  });
}

export function useProductOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: priceApprovalKeys.products(search),
    queryFn: ({ signal }) => priceApprovalApi.products(search, signal),
    enabled,
    ...options,
  });
}

export function useManagerOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: priceApprovalKeys.managers(search),
    queryFn: ({ signal }) => priceApprovalApi.productManagers(search, signal),
    enabled,
    ...options,
  });
}
