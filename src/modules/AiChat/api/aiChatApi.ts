import { apiClient } from '@/core/api';
import { toUploadBlob } from '@/core/files';

import type { ChatHistory, ChatProgress, ChatSession, SendInput, SendResult } from '../types';

/**
 * The server waits for the AI before it answers, which can take well over a minute. The client's
 * default of 20 s would cut normal answers short.
 */
export const SEND_TIMEOUT_MS = 180_000;

/** The server runs the answer's query again to build the file. */
const EXPORT_TIMEOUT_MS = 60_000;

async function sendBody({ message, files, traceId }: SendInput) {
  if (files.length === 0) return { message, trace_id: traceId };
  const form = new FormData();
  form.append('message', message);
  form.append('trace_id', traceId);
  for (const file of files) {
    form.append('attachments[]', await toUploadBlob(file), file.name);
  }
  return form;
}

export const aiChatApi = {
  /** The user's 20 newest sessions. */
  sessions: async (signal?: AbortSignal) =>
    (await apiClient.get<ChatSession[]>('/ai-chat/sessions', { signal })).data,

  createSession: async () =>
    (await apiClient.post<{ uuid: string; title: string }>('/ai-chat/sessions')).data,

  messages: async (uuid: string, signal?: AbortSignal) =>
    (await apiClient.get<ChatHistory>(`/ai-chat/sessions/${uuid}/messages`, { signal })).data,

  send: async (input: SendInput) =>
    (
      await apiClient.post<SendResult>(
        `/ai-chat/sessions/${input.sessionUuid}/messages`,
        await sendBody(input),
        { timeoutMs: SEND_TIMEOUT_MS },
      )
    ).data,

  /** The AI's steps for one send, by the `trace_id` the app sent with it. */
  progress: async (traceId: string, signal?: AbortSignal) =>
    (await apiClient.get<ChatProgress>(`/ai-chat/progress/${traceId}`, { signal })).data,

  deleteSession: async (uuid: string) => {
    await apiClient.delete<null>(`/ai-chat/sessions/${uuid}`);
  },

  attachment: (uuid: string) => apiClient.getFile(`/ai-chat/attachments/${uuid}`),

  /** The answer's data as .xlsx, built again on the server with the user's current access. */
  exportMessage: (uuid: string) =>
    apiClient.getFile(`/ai-chat/messages/${uuid}/export`, { timeoutMs: EXPORT_TIMEOUT_MS }),
};
