import { useMutation } from '@tanstack/react-query';

import { shareFile } from '@/core/files';

import { registerCustomerApi } from '../api/registerCustomerApi';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export interface ExportRange {
  dateFrom: string;
  dateTo: string;
}

/**
 * Builds the Excel file for a date range on the server, then hands it to the user to save or
 * send. Nothing is cached or kept: an export is a one-off action, not data the screens show.
 */
export function useExportRegisterCustomers() {
  return useMutation({
    mutationFn: async ({ dateFrom, dateTo }: ExportRange) => {
      const bytes = await registerCustomerApi.exportXlsx(dateFrom, dateTo);
      await shareFile(bytes, `register-customer_${dateFrom}_${dateTo}.xlsx`, XLSX_MIME);
    },
  });
}
