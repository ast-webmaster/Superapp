import { apiClient } from '@/core/api';

import type {
  CheckInput,
  CheckOutPreview,
  CustomerChoice,
  CustomerLocations,
  GeocodeHit,
  GpsFix,
  PageMeta,
  SalesVisitationDetail,
  SalesVisitationDraft,
  SalesVisitationListFilters,
  SalesVisitationListItem,
  SalesVisitationOptions,
} from '../types';
import { buildCapture, fixBody } from './buildCapture';

const PAGE_SIZE = 15;
/** A photo goes up with the request, and the address search waits for a third-party service. */
const SLOW_TIMEOUT_MS = 60_000;

const BASE = '/sales-visitation';

/** The body of a create, or of an edit while the visit is still planned. */
function draftBody(draft: SalesVisitationDraft) {
  return {
    is_unregistered: draft.unregistered,
    customer_id: draft.unregistered ? undefined : draft.customer?.customer_id,
    customer_name: draft.unregistered ? draft.customerName.trim() : undefined,
    title: draft.title.trim(),
    visitation_date: draft.date,
    latitude: draft.location?.latitude,
    longitude: draft.location?.longitude,
    location_label: draft.location?.label.trim() || undefined,
    purpose_ids: draft.purposeIds,
    category_codes: draft.categoryCodes,
    plan: draft.plan.trim(),
    result: draft.result.trim() || undefined,
  };
}

export const salesVisitationApi = {
  list: async (
    filters: SalesVisitationListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    // The server wants both ends of the date range or neither.
    const { dateFrom, dateTo } = filters;
    const hasRange = dateFrom !== null && dateTo !== null;
    const response = await apiClient.get<SalesVisitationListItem[], PageMeta>(BASE, {
      query: {
        status: filters.status === 'all' ? undefined : filters.status,
        date_from: hasRange ? dateFrom : undefined,
        date_to: hasRange ? dateTo : undefined,
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** Purposes, brand categories and the panel rules. Not paged. */
  options: async (signal?: AbortSignal) =>
    (await apiClient.get<SalesVisitationOptions>(`${BASE}/options`, { signal })).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<SalesVisitationDetail>(`${BASE}/${uuid}`, { signal })).data,

  /** Plans a visit (`PLANNED`). 422: a field is wrong, and nothing was saved. */
  create: async (draft: SalesVisitationDraft) =>
    (await apiClient.post<SalesVisitationDetail>(BASE, draftBody(draft))).data,

  /** While `PLANNED` the whole plan is replaced; afterwards the server takes only the result. */
  update: async (uuid: string, draft: SalesVisitationDraft, resultOnly: boolean) =>
    (
      await apiClient.put<SalesVisitationDetail>(
        `${BASE}/${uuid}`,
        // An empty string clears the result: Laravel turns it into null.
        resultOnly ? { result: draft.result.trim() } : draftBody(draft),
      )
    ).data,

  /** Only a `PLANNED` visit of the signed-in user. */
  remove: async (uuid: string) => {
    await apiClient.delete<null>(`${BASE}/${uuid}`);
  },

  checkIn: async (uuid: string, input: CheckInput) =>
    (
      await apiClient.post<SalesVisitationDetail>(
        `${BASE}/${uuid}/check-in`,
        await buildCapture(input),
        { timeoutMs: SLOW_TIMEOUT_MS },
      )
    ).data,

  /** What check-out would record, so the user can confirm. Saves nothing. */
  checkOutPreview: async (uuid: string, fix: GpsFix | null) =>
    (await apiClient.post<CheckOutPreview>(`${BASE}/${uuid}/check-out/preview`, fixBody(fix))).data,

  /** The server judges again; the preview's numbers are never sent back. */
  checkOut: async (uuid: string, input: CheckInput) =>
    (
      await apiClient.post<SalesVisitationDetail>(
        `${BASE}/${uuid}/check-out`,
        await buildCapture(input),
        { timeoutMs: SLOW_TIMEOUT_MS },
      )
    ).data,

  /** A proof photo of the visit. `type` is where it was taken. */
  photo: (uuid: string, type: 'in' | 'out', signal?: AbortSignal) =>
    apiClient.getFile(`${BASE}/${uuid}/photo/${type}`, { signal, timeoutMs: SLOW_TIMEOUT_MS }),

  /** Registered companies by name or id. The server wants at least two characters. */
  customers: async (term: string, signal?: AbortSignal) =>
    (await apiClient.get<CustomerChoice[]>(`${BASE}/customers`, { query: { term }, signal })).data,

  customerLocations: async (customerId: string, signal?: AbortSignal) =>
    (
      await apiClient.get<CustomerLocations>(`${BASE}/customer-locations`, {
        query: { customer_id: customerId },
        signal,
      })
    ).data,

  /** Address to coordinates. 429 when asked faster than once a second, 503 when the service is down. */
  geocode: async (q: string, signal?: AbortSignal) =>
    (
      await apiClient.get<GeocodeHit[]>(`${BASE}/geocode`, {
        query: { q },
        signal,
        timeoutMs: SLOW_TIMEOUT_MS,
      })
    ).data,

  /** Coordinates out of a pasted Google Maps link or a "lat, lng" text. */
  mapLink: async (link: string) =>
    (
      await apiClient.get<{ lat: number; lng: number }>(`${BASE}/map-link`, {
        query: { link },
        timeoutMs: SLOW_TIMEOUT_MS,
      })
    ).data,
};
