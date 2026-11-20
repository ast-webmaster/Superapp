/** Every React Query key of this module. The first segment is the manifest id. */
export const dataCustomerKeys = {
  all: ['data-customer'] as const,
  lists: () => [...dataCustomerKeys.all, 'list'] as const,
  list: (search: string) => [...dataCustomerKeys.lists(), search] as const,
  details: () => [...dataCustomerKeys.all, 'detail'] as const,
  detail: (id: string) => [...dataCustomerKeys.details(), id] as const,
};
