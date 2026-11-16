import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { marketingActivityApi } from '../api/marketingActivityApi';
import type { MarketingActivityKind } from '../types';

export type MarketingActivityFile =
  { type: 'pdf'; name: string } | { type: 'attachment'; id: number; name: string };

/**
 * Downloads the activity's PDF or one of its attachments and hands it to the user to open, print
 * or save. Nothing is cached: a download is a one-off action, not data the screens show.
 */
export function useMarketingActivityFile(kind: MarketingActivityKind, uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: MarketingActivityFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        file.type === 'pdf'
          ? marketingActivityApi.pdf(kind, uuid)
          : marketingActivityApi.attachment(kind, uuid, file.id),
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
    /** The file being fetched, to show its button or row as busy. */
    pending: isPending ? variables : undefined,
  };
}
