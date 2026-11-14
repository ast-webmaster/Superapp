import { useMutation } from '@tanstack/react-query';

import { AppError } from '@/core/errors';
import { shareFile } from '@/core/files';
import { useToast } from '@/shared/ui';

import { aiChatApi } from '../api/aiChatApi';
import type { ChatAttachment } from '../types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: XLSX_MIME,
  xls: 'application/vnd.ms-excel',
};

const pad = (value: number) => String(value).padStart(2, '0');

/** "ai-chat-20261114-1542.xlsx", on the phone's clock. */
export function exportFilename(date: Date) {
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return `ai-chat-${day}-${pad(date.getHours())}${pad(date.getMinutes())}.xlsx`;
}

/** Downloads a chat attachment or an answer's Excel export and hands it to the user. */
export function useChatFile() {
  const toast = useToast();
  const onError = (error: unknown) =>
    toast.show({
      tone: 'danger',
      message:
        error instanceof AppError ? error.message : 'Could not download the file. Try again.',
    });

  const attachment = useMutation({
    mutationFn: async (file: ChatAttachment) =>
      shareFile(
        await aiChatApi.attachment(file.uuid),
        file.name,
        MIME[file.extension.toLowerCase()] ?? 'application/octet-stream',
      ),
    onError,
  });

  const exported = useMutation({
    mutationFn: async (messageUuid: string) =>
      shareFile(await aiChatApi.exportMessage(messageUuid), exportFilename(new Date()), XLSX_MIME),
    onError,
  });

  return {
    downloadAttachment: attachment.mutate,
    exportMessage: exported.mutate,
    busy: attachment.isPending || exported.isPending,
    /** The answer whose export is being built, to show its button as loading. */
    exportingUuid: exported.isPending ? exported.variables : undefined,
  };
}
