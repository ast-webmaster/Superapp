import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';

import { stockPenjualanApi } from '../api/stockPenjualanApi';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Builds the Excel file on the server, then hands it to the user to save or send. Nothing is
 * cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportStock() {
  return useMutation({
    mutationFn: async () => {
      const bytes = await stockPenjualanApi.exportXlsx();
      await shareFile(
        bytes,
        `stock-penjualan_${new Date().toISOString().slice(0, 10)}.xlsx`,
        XLSX_MIME,
      );
    },
  });
}
