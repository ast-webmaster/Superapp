import { useQuery } from '@tanstack/react-query';

import { aiChatApi } from '../api/aiChatApi';
import { aiChatKeys } from '../api/aiChatKeys';

/** The user's 20 newest chats. Loaded only while the history sheet is open. */
export function useChatSessions(enabled: boolean) {
  return useQuery({
    queryKey: aiChatKeys.sessions(),
    queryFn: ({ signal }) => aiChatApi.sessions(signal),
    enabled,
  });
}
