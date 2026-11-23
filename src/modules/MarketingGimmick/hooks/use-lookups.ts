import { useQuery } from '@tanstack/react-query';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickFlow } from '../types';

/**
 * Destination offices of a request, for the picker. The server sends them all (a short list, no
 * paging), so the text narrows them here. Held until the picker opens.
 */
export function useOfficeOptions(flow: GimmickFlow, search: string, enabled: boolean) {
  return useQuery({
    queryKey: marketingGimmickKeys.offices(flow),
    queryFn: ({ signal }) => marketingGimmickApi.offices(flow, signal),
    enabled,
    select: (offices) => {
      const needle = search.trim().toLowerCase();
      return needle
        ? offices.filter((office) => office.name.toLowerCase().includes(needle))
        : offices;
    },
  });
}

/** Items by code or name, at most 20, searched on the server. Held until the picker opens. */
export function useItemOptions(flow: GimmickFlow, search: string, enabled: boolean) {
  return useQuery({
    queryKey: marketingGimmickKeys.items(flow, search),
    queryFn: ({ signal }) => marketingGimmickApi.items(flow, search, signal),
    enabled,
    // Stock moves under the user's feet, so a picker opened again asks again.
    staleTime: 0,
  });
}
