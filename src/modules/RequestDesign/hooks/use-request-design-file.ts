import { useMutation } from '@tanstack/react-query';
import { Linking } from 'react-native';

import { AppError } from '@/core/errors';
import { mimeTypeOf, shareFile } from '@/core/files';
import { useProgressToast } from '@/shared/hooks/use-progress-toast';
import { useToast } from '@/shared/ui';

import { requestDesignApi } from '../api/requestDesignApi';

/** A file of the document: the designer's result, or one reference of an item. */
export type FileTarget =
  | { kind: 'result'; name: string }
  | { kind: 'reference'; name: string; itemId: number; slot: number };

/** One id per file, to show its row as busy while it downloads. */
export const fileKey = (target: FileTarget) =>
  target.kind === 'result' ? 'result' : `reference-${target.itemId}-${target.slot}`;

/** Downloads a file of the document and hands it to the user to open or save. */
export function useRequestDesignFile(uuid: string) {
  const toast = useToast();
  const withProgress = useProgressToast();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: async (target: FileTarget) => {
      const bytes = await withProgress(`Downloading ${target.name}`, () =>
        target.kind === 'result'
          ? requestDesignApi.result(uuid)
          : requestDesignApi.reference(uuid, target.itemId, target.slot),
      );
      await shareFile(bytes, target.name, mimeTypeOf(target.name));
    },
    onError: (error) =>
      toast.show({
        tone: 'danger',
        message:
          error instanceof AppError ? error.message : 'Could not download the file. Try again.',
      }),
  });

  /** A link is not downloaded: the phone opens it in the browser. */
  const openLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      toast.show({ tone: 'danger', message: 'Could not open the link.' }),
    );

  return {
    download: mutate,
    openLink,
    /** The id of the file being fetched, if any. */
    pendingKey: isPending && variables ? fileKey(variables) : undefined,
  };
}
