import { apiClient } from '@/core/api';

import type {
  DeclarationDraft,
  OnDutyOptions,
  OnDutyRequestActionInput,
  OnDutyRequestDetail,
  OnDutyRequestDraft,
  OnDutyRequestListFilters,
  OnDutyRequestListItem,
  PageMeta,
  TripType,
} from '../types';
import { buildDeclarationForm } from './buildDeclarationForm';
import { buildRequestForm } from './buildRequestForm';

const PAGE_SIZE = 15;
/** The letter, up to ten files of 10 MB and a receipt per cost go up with one request. */
const SUBMIT_TIMEOUT_MS = 120_000;
/** A stored file can be large and the connection slow. */
const DOWNLOAD_TIMEOUT_MS = 60_000;

export const onDutyRequestApi = {
  list: async (
    filters: OnDutyRequestListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ) => {
    const response = await apiClient.get<OnDutyRequestListItem[], PageMeta>('/on-duty-request', {
      query: {
        status: filters.status === 'all' ? undefined : filters.status,
        date_from: filters.dateFrom ?? undefined,
        date_to: filters.dateTo ?? undefined,
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** Brands, expense kinds and the allowance rates of the signed-in user's level. */
  options: async (signal?: AbortSignal) =>
    (await apiClient.get<OnDutyOptions>('/on-duty-request/options', { signal })).data,

  /** Cities (domestic) or countries (overseas), at most 50, narrowed by `search`. */
  destinations: async (type: TripType, search: string, signal?: AbortSignal) =>
    (
      await apiClient.get<string[]>('/on-duty-request/destinations', {
        query: { type, search: search || undefined },
        signal,
      })
    ).data,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<OnDutyRequestDetail>(`/on-duty-request/${uuid}`, { signal })).data,

  /** Resolves with the new document. 422: a field is wrong, and nothing was saved. */
  create: async (draft: OnDutyRequestDraft) =>
    (
      await apiClient.post<OnDutyRequestDetail>('/on-duty-request', await buildRequestForm(draft), {
        timeoutMs: SUBMIT_TIMEOUT_MS,
      })
    ).data,

  /** Replaces the whole content of a document that was sent back. 409: it is no longer in REVISE. */
  resubmit: async (uuid: string, draft: OnDutyRequestDraft) =>
    (
      await apiClient.post<OnDutyRequestDetail>(
        `/on-duty-request/${uuid}/resubmit`,
        await buildRequestForm(draft),
        { timeoutMs: SUBMIT_TIMEOUT_MS },
      )
    ).data,

  /** Sends or re-sends the declaration. 409: it cannot be sent in the document's status now. */
  declare: async (uuid: string, draft: DeclarationDraft) =>
    (
      await apiClient.post<OnDutyRequestDetail>(
        `/on-duty-request/${uuid}/declaration`,
        await buildDeclarationForm(draft),
        { timeoutMs: SUBMIT_TIMEOUT_MS },
      )
    ).data,

  /** Resolves with the document as the server now has it. 409: it changed since `updatedAt`. */
  act: async (uuid: string, { action, remarks, updatedAt }: OnDutyRequestActionInput) =>
    (
      await apiClient.post<OnDutyRequestDetail>(`/on-duty-request/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
        updated_at: updatedAt,
      })
    ).data,

  letter: (uuid: string) =>
    apiClient.getFile(`/on-duty-request/${uuid}/letter-of-assignment`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  attachment: (uuid: string, attachmentId: number) =>
    apiClient.getFile(`/on-duty-request/${uuid}/attachments/${attachmentId}/download`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),

  receipt: (uuid: string, costId: number) =>
    apiClient.getFile(`/on-duty-request/${uuid}/costs/${costId}/receipt`, {
      timeoutMs: DOWNLOAD_TIMEOUT_MS,
    }),
};
