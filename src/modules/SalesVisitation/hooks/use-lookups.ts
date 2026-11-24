import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';

/** The server wants at least this many characters before it searches. */
export const CUSTOMER_MIN_CHARS = 2;
export const GEOCODE_MIN_CHARS = 3;

/** Registered companies matching what the user typed. Waits for the typing to pause. */
export function useCustomerSearch(text: string, enabled: boolean) {
  const term = useDebouncedValue(text.trim());
  return useQuery({
    queryKey: salesVisitationKeys.customers(term),
    queryFn: ({ signal }) => salesVisitationApi.customers(term, signal),
    enabled: enabled && term.length >= CUSTOMER_MIN_CHARS,
    placeholderData: keepPreviousData,
  });
}

/** Places this customer was visited at, and its registered addresses. */
export function useCustomerLocations(customerId: string | null) {
  return useQuery({
    queryKey: salesVisitationKeys.customerLocations(customerId ?? ''),
    queryFn: ({ signal }) => salesVisitationApi.customerLocations(customerId ?? '', signal),
    enabled: customerId !== null,
  });
}

/**
 * Address search, run only when the user asks (`term` is set on submit, not while typing): the
 * server allows one search a second for everyone, so typing-as-you-search would be refused.
 * Not retried: a 429 or 503 needs the user to wait, not the app to repeat.
 */
export function useGeocode(term: string | null) {
  return useQuery({
    queryKey: salesVisitationKeys.geocode(term ?? ''),
    queryFn: ({ signal }) => salesVisitationApi.geocode(term ?? '', signal),
    enabled: term !== null && term.length >= GEOCODE_MIN_CHARS,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/** Reads the coordinates out of a pasted Google Maps link. A call the user triggers, never cached. */
export function useMapLink() {
  return useMutation({
    mutationKey: [...salesVisitationKeys.all, 'map-link'],
    mutationFn: (link: string) => salesVisitationApi.mapLink(link),
  });
}
