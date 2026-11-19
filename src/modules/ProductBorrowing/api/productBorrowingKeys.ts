import type { ProductBorrowingListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const productBorrowingKeys = {
  all: ['product-borrowing'] as const,
  lists: () => [...productBorrowingKeys.all, 'list'] as const,
  list: (filters: ProductBorrowingListFilters, search: string) =>
    [...productBorrowingKeys.lists(), filters, search] as const,
  details: () => [...productBorrowingKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...productBorrowingKeys.details(), uuid] as const,
  /** The pickers of the form. They are never invalidated by an action. */
  lookups: () => [...productBorrowingKeys.all, 'lookup'] as const,
  options: () => [...productBorrowingKeys.lookups(), 'options'] as const,
  customers: (search: string) => [...productBorrowingKeys.lookups(), 'customers', search] as const,
  stock: (warehouse: string, search: string) =>
    [...productBorrowingKeys.lookups(), 'stock', warehouse, search] as const,
};
