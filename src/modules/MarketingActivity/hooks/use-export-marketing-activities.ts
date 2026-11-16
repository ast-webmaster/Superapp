import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';

import { marketingActivityApi } from '../api/marketingActivityApi';
import type { MarketingActivityKind } from '../types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface ExportRange {
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds the Excel file for a date range on the server, then hands it to the user to save or
 * send. Nothing is cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportMarketingActivities(kind: MarketingActivityKind) {
  return useMutation({
    mutationFn: async ({ dateFrom, dateTo }: ExportRange) => {
      const bytes = await marketingActivityApi.exportXlsx(kind, dateFrom, dateTo);
      const name = kind === 'combination' ? 'marketing-activity-combination' : 'marketing-activity';
      await shareFile(bytes, `${name}_${dateFrom}_${dateTo}.xlsx`, XLSX_MIME);
    },
  });
}
