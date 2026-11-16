import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';

import { marketingPromoApi } from '../api/marketingPromoApi';
import type { MarketingPromoKind } from '../types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface ExportRange {
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds the Excel file for a date range on the server, then hands it to the user to save or
 * send. Nothing is cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportMarketingPromos(kind: MarketingPromoKind) {
  return useMutation({
    mutationFn: async ({ dateFrom, dateTo }: ExportRange) => {
      const bytes = await marketingPromoApi.exportXlsx(kind, dateFrom, dateTo);
      const name = kind === 'combination' ? 'marketing-promo-combination' : 'marketing-promo';
      await shareFile(bytes, `${name}_${dateFrom}_${dateTo}.xlsx`, XLSX_MIME);
    },
  });
}
