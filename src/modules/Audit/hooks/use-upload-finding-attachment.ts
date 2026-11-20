import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { PickedFile } from '@/core/files';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';

export interface UploadFindingAttachmentInput {
  findingId: number;
  file: PickedFile;
  description: string;
}

/** Adds evidence to one finding. The finding carries its attachments, so the list reloads. */
export function useUploadFindingAttachment(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...auditKeys.part(uuid, 'findings'), 'upload'],
    mutationFn: ({ findingId, file, description }: UploadFindingAttachmentInput) =>
      auditApi.uploadFindingAttachment(uuid, findingId, file, description),
    onSettled: () =>
      // A lost connection may still have saved the file, so a failure reloads it too.
      queryClient.invalidateQueries({ queryKey: auditKeys.part(uuid, 'findings') }),
  });
}
