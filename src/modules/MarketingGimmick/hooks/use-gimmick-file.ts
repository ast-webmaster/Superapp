import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import type { GimmickAttachment, GimmickFlow } from '../types';

/** Downloads a file of the document and hands it to the user to open or save. */
export function useGimmickFile(flow: GimmickFlow, uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: GimmickAttachment) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        marketingGimmickApi.attachment(flow, uuid, file.slot),
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
