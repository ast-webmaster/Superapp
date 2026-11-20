import { apiClient } from '@/core/api';
import { toUploadBlob, type PickedFile } from '@/core/files';

import type {
  AuditActionInput,
  AuditApproval,
  AuditAttachment,
  AuditChecklist,
  AuditDetail,
  AuditFinding,
  AuditListFilters,
  AuditListItem,
  AuditPage,
  AuditProgram,
  ChecklistMeta,
  FindingMeta,
  FindingResponseInput,
  PageMeta,
  ProgramMeta,
} from '../types';

const PAGE_SIZE = 15;
const PATH = '/audit';
/** A file of up to 30 MB goes up with the request, which a slow connection needs longer for. */
const UPLOAD_TIMEOUT_MS = 60_000;

export const auditApi = {
  list: async (
    filters: AuditListFilters,
    search: string,
    page: number,
    signal?: AbortSignal,
  ): Promise<AuditPage> => {
    const response = await apiClient.get<AuditListItem[], PageMeta>(PATH, {
      query: {
        tab: filters.tab === 'all' ? undefined : filters.tab,
        status: filters.status === 'all' ? undefined : filters.status,
        year: filters.year ?? undefined,
        // The server refuses a month without a year.
        month: filters.year === null ? undefined : (filters.month ?? undefined),
        search: search || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /** How many cards wait for this user. Open to every signed-in user. */
  actionCount: async (signal?: AbortSignal) =>
    (await apiClient.get<{ count: number }>(`${PATH}/action-count`, { signal })).data.count,

  detail: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<AuditDetail>(`${PATH}/${uuid}`, { signal })).data,

  /**
   * Resolves with the card as the server now has it. The server refuses an action that is not
   * the user's, does not fit the status, or is not ready yet with 422 and the reason in `message`.
   */
  act: async (uuid: string, { action, remarks }: AuditActionInput) =>
    (
      await apiClient.post<AuditDetail>(`${PATH}/${uuid}/actions`, {
        action,
        remarks: remarks || undefined,
      })
    ).data,

  approvals: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<AuditApproval[]>(`${PATH}/${uuid}/approvals`, { signal })).data,

  checklists: async (uuid: string, signal?: AbortSignal) => {
    const response = await apiClient.get<AuditChecklist[], ChecklistMeta>(
      `${PATH}/${uuid}/checklists`,
      { signal },
    );
    return { items: response.data, meta: response.meta };
  },

  attachments: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<AuditAttachment[]>(`${PATH}/${uuid}/attachments`, { signal })).data,

  programs: async (uuid: string, signal?: AbortSignal) => {
    const response = await apiClient.get<AuditProgram[], ProgramMeta>(`${PATH}/${uuid}/programs`, {
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  findings: async (uuid: string, signal?: AbortSignal) => {
    const response = await apiClient.get<AuditFinding[], FindingMeta>(`${PATH}/${uuid}/findings`, {
      signal,
    });
    return { items: response.data, meta: response.meta };
  },

  /**
   * Saves the auditee response and due date of one finding. Either may be empty: the server keeps
   * a half-filled finding, and clears a field that is sent empty.
   */
  respond: async (uuid: string, { findingId, auditeeResponse, dueDate }: FindingResponseInput) =>
    (
      await apiClient.put<AuditFinding>(`${PATH}/${uuid}/findings/${findingId}/response`, {
        auditee_response: auditeeResponse.trim() || null,
        due_date: dueDate,
      })
    ).data,

  /** Evidence for one finding, as multipart. 422: the file or description is refused. */
  uploadFindingAttachment: async (
    uuid: string,
    findingId: number,
    file: PickedFile,
    description: string,
  ) => {
    const form = new FormData();
    form.append('file', await toUploadBlob(file), file.name);
    form.append('description', description.trim());
    return (
      await apiClient.post<AuditAttachment>(
        `${PATH}/${uuid}/findings/${findingId}/attachments`,
        form,
        { timeoutMs: UPLOAD_TIMEOUT_MS },
      )
    ).data;
  },

  /** The card attachment's bytes. The absolute `download_url` the server sends is not used. */
  downloadAttachment: (uuid: string, id: number) =>
    apiClient.getFile(`${PATH}/${uuid}/attachments/${id}/download`, {
      timeoutMs: UPLOAD_TIMEOUT_MS,
    }),

  downloadFindingAttachment: (uuid: string, findingId: number, id: number) =>
    apiClient.getFile(`${PATH}/${uuid}/findings/${findingId}/attachments/${id}/download`, {
      timeoutMs: UPLOAD_TIMEOUT_MS,
    }),
};
