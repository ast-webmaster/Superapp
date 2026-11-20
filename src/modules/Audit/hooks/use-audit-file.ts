import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { auditApi } from '../api/auditApi';

/** A card attachment, or one attached to a finding. */
export type AuditFile =
  | { kind: 'card'; id: number; name: string }
  | { kind: 'finding'; findingId: number; id: number; name: string };

/** Downloads an attachment and hands it to the user to open or save. */
export function useAuditFile(uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (file: AuditFile) => {
      const bytes = await withProgress(`Downloading ${file.name}`, () =>
        file.kind === 'card'
          ? auditApi.downloadAttachment(uuid, file.id)
          : auditApi.downloadFindingAttachment(uuid, file.findingId, file.id),
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
