import { EmptyState, Screen } from '@/shared/ui';

import { TabHeader } from './tab-header';

export function InboxScreen() {
  return (
    <Screen>
      <TabHeader title="Inbox" />
      <EmptyState icon="bell" title="Nothing new" description="Requests and updates for you will show up here." />
    </Screen>
  );
}
