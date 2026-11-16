import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { purchaseRequestApi } from '../api/purchaseRequestApi';

export type PurchaseRequestFile =
  { kind: 'attachment'; id: number; name: string } | { kind: 'document'; id: number; name: string };

/** Downloads an attachment or an item's document and hands it to the user to open or save. */
export function usePurchaseRequestFile(uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: PurchaseRequestFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        file.kind === 'attachment'
          ? purchaseRequestApi.attachment(uuid, file.id)
          : purchaseRequestApi.itemDocument(uuid, file.id),
      );
      await shareFile(bytes, file.name, mimeTypeOf(file.name));
    },
    onError: (error) =>
      toast.show({
        tone: 'danger',
        message:
          error instanceof AppError ? error.message : 'Could not download the file. Try again.',
      }),
  });

  return {
    download: mutate,
    /** The file being fetched, to show its row as busy. */
    pending: isPending ? variables : undefined,
  };
}
