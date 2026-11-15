import { apiClient } from '@/core/api';

import type { GroupDetail, ReportPeriods, ReportSummary } from '../types';

/** The server builds the file before it answers, so it gets longer than a normal request. */
const EXPORT_TIMEOUT_MS = 60_000;

// The backend module is called WallReport, so its path is `wall-report`.
const PATH = '/wall-report';

/** `null` lets the server pick its default period. */
const periodQuery = (period: string | null) => ({ period: period ?? undefined });

export const laporanPenjualanApi = {
  periods: async (signal?: AbortSignal) =>
    (await apiClient.get<ReportPeriods>(`${PATH}/periods`, { signal })).data,

  summary: async (period: string | null, signal?: AbortSignal) =>
    (await apiClient.get<ReportSummary>(PATH, { query: periodQuery(period), signal })).data,

  /** Answers 404 for a group that is not in the period or outside the user's scope. */
  group: async (period: string | null, group: string, signal?: AbortSignal) =>
    (
      await apiClient.get<GroupDetail>(`${PATH}/group`, {
        query: { ...periodQuery(period), group },
        signal,
      })
    ).data,

  /** The brand table of one period, as the web page exports it. */
  exportFile: (format: 'xlsx' | 'pdf', period: string | null) =>
    apiClient.getFile(`${PATH}/${format === 'xlsx' ? 'export' : 'pdf'}`, {
      query: periodQuery(period),
      timeoutMs: EXPORT_TIMEOUT_MS,
    }),
};
