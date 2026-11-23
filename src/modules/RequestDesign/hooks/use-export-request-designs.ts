import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';

import { requestDesignApi } from '../api/requestDesignApi';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface ExportRange {
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds the Excel file for a date range on the server, then hands it to the user to save or
 * send. Nothing is cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportRequestDesigns() {
  return useMutation({
    mutationFn: async ({ dateFrom, dateTo }: ExportRange) => {
      const bytes = await requestDesignApi.exportXlsx(dateFrom, dateTo);
      await shareFile(bytes, `request-design_${dateFrom}_${dateTo}.xlsx`, XLSX_MIME);
    },
  });
}
