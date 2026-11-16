import { create } from 'zustand';

import { useAuthStore } from '@/core/auth';
import type { PickedFile } from '@/core/files';

/** A message on its way to the server. Shown as a bubble until the server's history has it. */
export type PendingSend = {
  /** `null` while the session for a new chat is still being created. */
  sessionUuid: string | null;
  message: string;
  files: PickedFile[];
  traceId: string;
};

/**
 * What the user tried to send when it failed, so it can go back in the composer. `error` is the
 * server's reason when it refused the message; without it the outcome is unknown.
 */
export type FailedDraft = { message: string; files: PickedFile[]; error?: string };

// Client-only UI state for the chat. Messages and sessions live in React Query, not here.
type AiChatState = {
  /** `null` is a new chat that has no session on the server yet. */
  activeSessionUuid: string | null;
  pending: PendingSend | null;
  failedDraft: FailedDraft | null;
  setActiveSession: (uuid: string | null) => void;
  setPending: (pending: PendingSend | null) => void;
  setFailedDraft: (draft: FailedDraft | null) => void;
};

export const useAiChatStore = create<AiChatState>((set) => ({
  activeSessionUuid: null,
  pending: null,
  failedDraft: null,
  // A message that did not send stays offered back across chats: its text exists nowhere else.
  setActiveSession: (activeSessionUuid) => set({ activeSessionUuid }),
  setPending: (pending) => set({ pending }),
  setFailedDraft: (failedDraft) => set({ failedDraft }),
}));

// The next user who signs in on this device never sees this user's chat.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    useAiChatStore.setState({ activeSessionUuid: null, pending: null, failedDraft: null });
  }
});
