import { apiClient } from '@/core/api';

import { flows } from '../flows';
import type {
  GimmickActionInput,
  GimmickDetail,
  GimmickDraft,
  GimmickFlow,
  GimmickListFilters,
  GimmickListItem,
  ItemOption,
  OfficeOption,
  PageMeta,
} from '../types';
import { buildCreateForm } from './buildCreateForm';

const PAGE_SIZE = 15;
/** The file goes up with the document, and a download is built on the server: both can be slow. */
const FILE_TIMEOUT_MS = 60_000;

const base = (flow: GimmickFlow) => `/${flows[flow].slug}`;

export const marketingGimmickApi = {
  list: async (
    flow: GimmickFlow,
    filters: GimmickListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    // The server wants both ends of the date range or neither.
    const { dateFrom, dateTo } = filters;
    const hasRange = dateFrom !== null && dateTo !== null;
    const response = await apiClient.get<GimmickListItem[], PageMeta>(base(flow), {
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

  /** Destination offices of a request. Not paged. */
  offices: async (flow: GimmickFlow, signal?: AbortSignal) =>
    (await apiClient.get<{ offices: OfficeOption[] }>(`${base(flow)}/options`, { signal })).data
      .offices,

  /** At most 20 items by code or name, with the stock the flow lets the user use. */
  items: async (flow: GimmickFlow, search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<ItemOption[]>(`${base(flow)}/items`, {
        query: { search: search || undefined },
        signal,
      })
    ).data,

  detail: async (flow: GimmickFlow, uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<GimmickDetail>(`${base(flow)}/${uuid}`, { signal })).data,

  /** Saves and submits in one call. 422: a field is wrong, and nothing was saved (not even stock). */
  create: async (flow: GimmickFlow, draft: GimmickDraft) =>
    (
      await apiClient.post<GimmickDetail>(base(flow), await buildCreateForm(flows[flow], draft), {
        timeoutMs: FILE_TIMEOUT_MS,
      })
    ).data,

  /** Resolves with the document as the server now has it. 409: it changed since `updatedAt`. */
  act: async (
    flow: GimmickFlow,
    uuid: string,
    { action, remarks, updatedAt }: GimmickActionInput,
  ) =>
    (
      await apiClient.post<GimmickDetail>(`${base(flow)}/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,

  /** A file of the document. `slot` comes from the detail's attachments. */
  attachment: (flow: GimmickFlow, uuid: string, slot: string) =>
    apiClient.getFile(`${base(flow)}/${uuid}/attachments/${slot}`, {
      timeoutMs: FILE_TIMEOUT_MS,
    }),
};
