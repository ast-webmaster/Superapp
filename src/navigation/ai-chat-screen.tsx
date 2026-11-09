import { EmptyState, Screen } from '@/shared/ui';

import { TabHeader } from './tab-header';

export function AiChatScreen() {
  return (
    <Screen>
      <TabHeader title="AI chat" />
      <EmptyState icon="ai" title="AI chat is coming soon" description="You will be able to ask questions here." />
    </Screen>
  );
}
