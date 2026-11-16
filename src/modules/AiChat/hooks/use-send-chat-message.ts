import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuthStore } from '@/core/auth';
import { AppError } from '@/core/errors';
import type { PickedFile } from '@/core/files';

import { aiChatApi } from '../api/aiChatApi';
import { aiChatKeys } from '../api/aiChatKeys';
import { useAiChatStore } from '../store/aiChatStore';
import type { ChatHistory } from '../types';
import { newTraceId } from '../utils/trace-id';

/** The ids of the chat's messages as cached now, or `null` when the chat has not loaded. */
const knownMessages = (queryClient: QueryClient, uuid: string | null): Set<string> | null => {
  if (!uuid) return new Set();
  const history = queryClient.getQueryData<ChatHistory>(aiChatKeys.messages(uuid));
  return history ? new Set(history.messages.map((message) => message.uuid)) : null;
};

/** The signed-in user, so a send that ends after sign-out writes nothing for the next user. */
const currentUser = () => {
  const { status, user } = useAuthStore.getState();
  return status === 'authenticated' ? (user?.id ?? null) : null;
};

/**
 * Sends one message and waits for the AI. The in-flight message is module state, not a mutation:
 * the answer can take minutes, and it must still land in its chat if the screen goes away.
 *
 * Never resent automatically. When the outcome is unknown (timeout, lost connection, 5xx) the
 * history is fetched again; only a new user message in it proves the send arrived. Otherwise the
 * user gets the message back to resend.
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient();
  const isPending = useAiChatStore((state) => state.pending !== null);

  const send = useCallback(
    async (message: string, files: PickedFile[]) => {
      const store = useAiChatStore.getState();
      if (store.pending) return;
      const user = currentUser();
      const stillSameUser = () => user !== null && currentUser() === user;
      const traceId = newTraceId();
      let sessionUuid = store.activeSessionUuid;
      const before = knownMessages(queryClient, sessionUuid);
      store.setFailedDraft(null);
      store.setPending({ sessionUuid, message, files, traceId });

      try {
        if (!sessionUuid) {
          // A new chat gets its session only now, so opening the tab never leaves an empty one.
          const created = (await aiChatApi.createSession()).uuid;
          if (!stillSameUser()) return;
          sessionUuid = created;
          useAiChatStore.getState().setActiveSession(created);
          useAiChatStore.getState().setPending({ sessionUuid: created, message, files, traceId });
        }
        await aiChatApi.send({ sessionUuid, message, files, traceId });
        if (!stillSameUser()) return;
        await queryClient.invalidateQueries({ queryKey: aiChatKeys.messages(sessionUuid) });
        void queryClient.invalidateQueries({ queryKey: aiChatKeys.sessions() });
        useAiChatStore.getState().setPending(null);
      } catch (error) {
        if (!stillSameUser()) return;
        const latest = useAiChatStore.getState();
        if (error instanceof AppError && error.code === 'validation') {
          // Nothing was saved: give the message back with the server's reason.
          latest.setPending(null);
          latest.setFailedDraft({ message, files, error: error.message });
          return;
        }
        if (sessionUuid) {
          await queryClient.invalidateQueries({ queryKey: aiChatKeys.messages(sessionUuid) });
          void queryClient.invalidateQueries({ queryKey: aiChatKeys.sessions() });
        }
        if (!stillSameUser()) return;
        const after = queryClient.getQueryData<ChatHistory>(
          aiChatKeys.messages(sessionUuid ?? 'new'),
        );
        const saved =
          before !== null &&
          (after?.messages ?? []).some((item) => item.role === 'user' && !before.has(item.uuid));
        latest.setPending(null);
        if (!saved) latest.setFailedDraft({ message, files });
      }
    },
    [queryClient],
  );

  return { send, isPending };
}
