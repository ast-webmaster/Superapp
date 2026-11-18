import type { RegisterCustomerListFilters } from '../types';

/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const registerCustomerKeys = {
  all: ['register-customer'] as const,
  lists: () => [...registerCustomerKeys.all, 'list'] as const,
  list: (filters: RegisterCustomerListFilters, search: string) =>
    [...registerCustomerKeys.lists(), filters, search] as const,
  details: () => [...registerCustomerKeys.all, 'detail'] as const,
  detail: (uuid: string) => [...registerCustomerKeys.details(), uuid] as const,
};
