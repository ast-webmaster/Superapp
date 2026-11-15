import { useQuery } from '@tanstack/react-query';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';

// `enabled` holds the request until a picker opens.

export function useVendorOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: purchaseRequestKeys.vendors(search),
    queryFn: ({ signal }) => purchaseRequestApi.vendors(search, signal),
    enabled,
  });
}

export function useItemOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: purchaseRequestKeys.items(search),
    queryFn: ({ signal }) => purchaseRequestApi.items(search, signal),
    enabled,
  });
}

/** The server has no office search: it sends every office, so the text narrows them here. */
export function useOfficeOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: purchaseRequestKeys.offices(),
    queryFn: ({ signal }) => purchaseRequestApi.offices(signal),
    enabled,
    select: (offices) => {
      const needle = search.trim().toLowerCase();
      return needle
        ? offices.filter((office) => office.office_name?.toLowerCase().includes(needle))
        : offices;
    },
  });
}
