import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';

import { stockGimmickApi } from '../api/stockGimmickApi';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Builds the Excel file on the server, then hands it to the user to save or send. Nothing is
 * cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportStockGimmick() {
  const withProgress = useProgressToast();

  return useMutation({
    mutationFn: async () => {
      const bytes = await withProgress('Preparing the Excel file', () =>
        stockGimmickApi.exportXlsx(),
      );
      await shareFile(
        bytes,
        `stock-gimmick_${new Date().toISOString().slice(0, 10)}.xlsx`,
        XLSX_MIME,
      );
    },
  });
}
