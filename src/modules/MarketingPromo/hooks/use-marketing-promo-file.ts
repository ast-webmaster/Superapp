import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { marketingPromoApi } from '../api/marketingPromoApi';
import type { MarketingPromoKind } from '../types';

export type MarketingPromoFile =
  | { type: 'pdf'; name: string }
  | { type: 'mechanism'; name: string }
  | { type: 'attachment'; id: number; name: string };

function fetchFile(kind: MarketingPromoKind, uuid: string, file: MarketingPromoFile) {
  switch (file.type) {
    case 'pdf':
      return marketingPromoApi.pdf(kind, uuid);
    case 'mechanism':
      return marketingPromoApi.mechanism(kind, uuid);
    case 'attachment':
      return marketingPromoApi.attachment(kind, uuid, file.id);
  }
}

/**
 * Downloads the promo's PDF, mechanism document or one of its attachments and hands it to the
 * user to open, print or save. Nothing is cached: a download is a one-off action, not data the
 * screens show.
 */
export function useMarketingPromoFile(kind: MarketingPromoKind, uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: MarketingPromoFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        fetchFile(kind, uuid, file),
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
