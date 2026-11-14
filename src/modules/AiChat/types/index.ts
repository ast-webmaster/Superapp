import type { PickedFile } from '@/core/files';

// Wire types of `v1/ai-chat` (digitalapproval/Modules/AiChat). Field names follow the wire.

export type ChatRole = 'user' | 'assistant';

export type ChatAttachment = {
  uuid: string;
  name: string;
  extension: string;
  size: number;
  /** Absolute web URL from the server. The app downloads through `aiChatApi.attachment` instead. */
  url: string;
};

export type ChatMeta = {
  type: string | null;
  /** Sent by the server, not shown in the app. */
  suggestions: string[];
  assumptions: string[];
  /** The answer's data can be downloaded as Excel. */
  exportable: boolean;
};

export type ChatMessage = {
  uuid: string;
  role: ChatRole;
  message: string;
  meta: ChatMeta | null;
  created_at: string;
  attachments: ChatAttachment[];
};

export type ChatSession = { uuid: string; title: string; created_at: string };

export type ChatHistory = { session: { uuid: string; title: string }; messages: ChatMessage[] };

export type ProgressStep = { key: string; label: string; status: 'running' | 'success' | 'error' };

export type ChatProgress = { steps: ProgressStep[]; done: boolean };

export type SendResult = {
  reply: string;
  message_uuid: string;
  meta: ChatMeta;
  tokens: number;
  title: string;
  attachments: ChatAttachment[];
};

export type SendInput = {
  sessionUuid: string;
  message: string;
  files: PickedFile[];
  traceId: string;
};
