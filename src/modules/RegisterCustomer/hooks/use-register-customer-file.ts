import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { registerCustomerApi } from '../api/registerCustomerApi';

export type RegisterCustomerFile =
  | { kind: 'document'; key: string; name: string }
  | { kind: 'attachment'; id: number; name: string };

/** Downloads a document or an attachment and hands it to the user to open or save. */
export function useRegisterCustomerFile(uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: RegisterCustomerFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        file.kind === 'document'
          ? registerCustomerApi.document(uuid, file.key)
          : registerCustomerApi.attachment(uuid, file.id),
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
