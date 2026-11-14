import { useMutation, useQueryClient } from '@tanstack/react-query';

import { aiChatApi } from '../api/aiChatApi';
import { aiChatKeys } from '../api/aiChatKeys';
import { useAiChatStore } from '../store/aiChatStore';

/** Deletes a chat with its messages and files, after the server confirms. */
export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => aiChatApi.deleteSession(uuid),
    onSuccess: (_, uuid) => {
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.sessions() });
      queryClient.removeQueries({ queryKey: aiChatKeys.messages(uuid) });
      const store = useAiChatStore.getState();
      if (store.activeSessionUuid === uuid) store.setActiveSession(null);
    },
  });
}
