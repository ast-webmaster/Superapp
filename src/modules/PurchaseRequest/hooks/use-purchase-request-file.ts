import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { shareFile } from '@/core/files';
import { useToast } from '@/shared/ui';

import { purchaseRequestApi } from '../api/purchaseRequestApi';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  msg: 'application/vnd.ms-outlook',
};

export type PurchaseRequestFile =
  { kind: 'attachment'; id: number; name: string } | { kind: 'document'; id: number; name: string };

function mimeOf(name: string) {
  return MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';
}

/** Downloads an attachment or an item's document and hands it to the user to open or save. */
export function usePurchaseRequestFile(uuid: string) {
  const toast = useToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: PurchaseRequestFile) => {
      const bytes =
        file.kind === 'attachment'
          ? await purchaseRequestApi.attachment(uuid, file.id)
          : await purchaseRequestApi.itemDocument(uuid, file.id);
      await shareFile(bytes, file.name, mimeOf(file.name));
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
