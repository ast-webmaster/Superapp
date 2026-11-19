import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { productBorrowingApi } from '../api/productBorrowingApi';

/** Downloads the document's PDF and hands it to the user to open or save. */
export function useProductBorrowingPdf(uuid: string, documentNo: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  return useMutation({
    mutationFn: async () => {
      const bytes = await withProgress('Downloading PDF', () => productBorrowingApi.pdf(uuid));
      // The number holds slashes (PB/11/2026/0007), which a file name cannot.
      await shareFile(bytes, `${documentNo.replaceAll('/', '-')}.pdf`, 'application/pdf');
    },
    onError: (error) =>
      toast.show({
        tone: 'danger',
        message:
          error instanceof AppError ? error.message : 'Could not download the file. Try again.',
      }),
  });
}
