import { useCan } from '@/core/permissions';
import { AI_CHAT_PERMISSIONS, AiChatScreen as Chat } from '@/modules/AiChat';
import { EmptyState, Screen } from '@/shared/ui';

import { TabHeader } from './tab-header';

/** The AI chat tab: the chat for users allowed to use it, the coming-soon page for everyone else. */
export function AiChatScreen() {
  const can = useCan();
  if (can(AI_CHAT_PERMISSIONS)) return <Chat />;
  return (
    <Screen>
      <TabHeader title="AI chat" />
      <EmptyState
        icon="ai"
        title="AI chat is coming soon"
        description="You will be able to ask questions here."
      />
    </Screen>
  );
}
