import type { ProductFilters } from '../types';

/** Every React Query key of this module. The first segment is the manifest id. */
export const dataProductKeys = {
  all: ['data-product'] as const,
  lists: () => [...dataProductKeys.all, 'list'] as const,
  list: (filters: ProductFilters, search: string) =>
    [...dataProductKeys.lists(), filters, search] as const,
  details: () => [...dataProductKeys.all, 'detail'] as const,
  detail: (id: string) => [...dataProductKeys.details(), id] as const,
  categories: () => [...dataProductKeys.all, 'categories'] as const,
};
