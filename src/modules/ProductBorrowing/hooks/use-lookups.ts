import { useQuery } from '@tanstack/react-query';

import { productBorrowingApi } from '../api/productBorrowingApi';
import { productBorrowingKeys } from '../api/productBorrowingKeys';
import type { PersonOption } from '../types';

/** Warehouses, product managers and marketing people. The form cannot start without them. */
export function useBorrowingOptions() {
  return useQuery({
    queryKey: productBorrowingKeys.options(),
    queryFn: ({ signal }) => productBorrowingApi.options(signal),
  });
}

function narrow(people: PersonOption[], search: string) {
  const needle = search.trim().toLowerCase();
  return needle
    ? people.filter((person) =>
        `${person.name ?? ''} ${person.email}`.toLowerCase().includes(needle),
      )
    : people;
}

/**
 * Product managers for the picker. The server sends them all with the options (a short list), so
 * the text narrows them here. Shares the options query: no second request.
 */
export function useProductManagerOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: productBorrowingKeys.options(),
    queryFn: ({ signal }) => productBorrowingApi.options(signal),
    enabled,
    select: ({ product_managers }) => narrow(product_managers, search),
  });
}

/** Marketing people for the picker, narrowed here like the product managers. */
export function useMarketingOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: productBorrowingKeys.options(),
    queryFn: ({ signal }) => productBorrowingApi.options(signal),
    enabled,
    select: ({ marketing }) => narrow(marketing, search),
  });
}

/** Customers by name or code, at most 20, searched on the server. Held until the picker opens. */
export function useCustomerOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: productBorrowingKeys.customers(search),
    queryFn: ({ signal }) => productBorrowingApi.customers(search, signal),
    enabled,
  });
}

/** Products with stock in one warehouse, at most 20, searched on the server. */
export function useStockOptions(warehouse: string | null, search: string, enabled: boolean) {
  return useQuery({
    queryKey: productBorrowingKeys.stock(warehouse ?? '', search),
    queryFn: ({ signal }) => productBorrowingApi.stock(warehouse ?? '', search, signal),
    enabled: enabled && warehouse !== null,
  });
}
