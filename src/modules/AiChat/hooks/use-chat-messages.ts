import { skipToken, useQuery } from '@tanstack/react-query';

import { aiChatApi } from '../api/aiChatApi';
import { aiChatKeys } from '../api/aiChatKeys';

/** The messages of one session. `null` is a new chat, which has none on the server yet. */
export function useChatMessages(uuid: string | null) {
  return useQuery({
    queryKey: aiChatKeys.messages(uuid ?? 'new'),
    queryFn: uuid ? ({ signal }) => aiChatApi.messages(uuid, signal) : skipToken,
  });
}
