import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';

import { laporanPenjualanApi } from '../api/laporanPenjualanApi';

const FILES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
} as const;

export type ExportFormat = keyof typeof FILES;

/**
 * Builds the brand table of one period on the server, then hands it to the user to save or send.
 * Nothing is cached: an export is a one-off action, not data the screens show.
 */
export function useExportReport() {
  const withProgress = useProgressToast();

  return useMutation({
    mutationFn: async ({ format, period }: { format: ExportFormat; period: string }) => {
      const bytes = await withProgress(
        `Preparing the ${format === 'xlsx' ? 'Excel' : 'PDF'} file`,
        () => laporanPenjualanApi.exportFile(format, period),
      );
      await shareFile(bytes, `laporan-penjualan_${period}.${format}`, FILES[format]);
    },
  });
}
