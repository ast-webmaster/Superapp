import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';

import { stockPenjualanApi } from '../api/stockPenjualanApi';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Builds the Excel file on the server, then hands it to the user to save or send. Nothing is
 * cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportStock() {
  const withProgress = useProgressToast();

  return useMutation({
    mutationFn: async () => {
      const bytes = await withProgress('Preparing the Excel file', () =>
        stockPenjualanApi.exportXlsx(),
      );
      await shareFile(
        bytes,
        `stock-penjualan_${new Date().toISOString().slice(0, 10)}.xlsx`,
        XLSX_MIME,
      );
    },
  });
}
