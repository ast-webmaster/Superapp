import { useQuery } from '@tanstack/react-query';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';
import type { TripType } from '../types';

/** Brands, expense kinds and allowance rates. The form cannot start without them. */
export function useOnDutyOptions() {
  return useQuery({
    queryKey: onDutyRequestKeys.options(),
    queryFn: ({ signal }) => onDutyRequestApi.options(signal),
  });
}

/**
 * The expense kinds for the picker. The server sends them all with the options (a short list),
 * so the text narrows them here. Shares the options query: no second request.
 */
export function useCostItemOptions(search: string, enabled: boolean) {
  return useQuery({
    queryKey: onDutyRequestKeys.options(),
    queryFn: ({ signal }) => onDutyRequestApi.options(signal),
    enabled,
    select: ({ items }) => {
      const needle = search.trim().toLowerCase();
      return needle
        ? items.filter((item) =>
            `${item.item_description ?? ''} ${item.item_code}`.toLowerCase().includes(needle),
          )
        : items;
    },
  });
}

/** Cities or countries by name, at most 50, searched on the server. Held until the picker opens. */
export function useDestinationOptions(type: TripType | null, search: string, enabled: boolean) {
  return useQuery({
    queryKey: onDutyRequestKeys.destinations(type ?? 'DOMESTIC', search),
    queryFn: ({ signal }) => onDutyRequestApi.destinations(type ?? 'DOMESTIC', search, signal),
    enabled: enabled && type !== null,
  });
}
