import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { sniffExtension } from './sniff-extension';

export type OnDutyRequestFile =
  | { kind: 'letter'; id: 0; name: string }
  | { kind: 'attachment'; id: number; name: string }
  | { kind: 'receipt'; id: number; name: string };

/** Downloads the letter, an attachment or a receipt and hands it to the user to open or save. */
export function useOnDutyRequestFile(uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: OnDutyRequestFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        file.kind === 'letter'
          ? onDutyRequestApi.letter(uuid)
          : file.kind === 'attachment'
            ? onDutyRequestApi.attachment(uuid, file.id)
            : onDutyRequestApi.receipt(uuid, file.id),
      );
      // An attachment keeps the name it was uploaded with; the others have none, so the type
      // is read from the bytes.
      const extension = file.kind === 'attachment' ? '' : sniffExtension(bytes);
      const filename =
        file.kind === 'attachment' || !extension ? file.name : `${file.name}.${extension}`;
      await shareFile(bytes, filename, mimeTypeOf(filename));
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
