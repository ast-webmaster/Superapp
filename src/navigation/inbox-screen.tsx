import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { InboxRow, InboxRowsSkeleton, useInbox, useRefreshInboxOnFocus } from '@/modules/Inbox';
import { Button, EmptyState, ListGroup, Screen, useBottomNavInset } from '@/shared/ui';

import { inboxRowProps } from './inbox-row-props';
import { TabHeader } from './tab-header';

export function InboxScreen() {
  const bottomInset = useBottomNavInset();
  useRefreshInboxOnFocus();
  const { data, error, fetchStatus, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInbox();

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  return (
    <Screen>
      <TabHeader title="Inbox" />
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load your inbox"
            description={toAppError(error).message}>
            {retry}
          </EmptyState>
        ) : fetchStatus === 'paused' ? (
          <EmptyState
            icon="alert"
            title="You are offline"
            description="Check your connection and try again.">
            {retry}
          </EmptyState>
        ) : (
          <View className="p-5">
            <InboxRowsSkeleton />
          </View>
        )
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Nothing new"
          description="Requests and updates for you will show up here."
        />
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 p-5"
          contentContainerStyle={{ paddingBottom: bottomInset }}>
          <ListGroup>
            {data.items.map((item) => (
              <InboxRow key={item.id} item={item} {...inboxRowProps(item)} />
            ))}
          </ListGroup>
          {hasNextPage ? (
            <Button variant="soft" loading={isFetchingNextPage} onPress={() => fetchNextPage()}>
              Show more
            </Button>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
