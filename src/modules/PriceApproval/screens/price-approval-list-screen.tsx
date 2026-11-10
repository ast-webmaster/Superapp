import { clsx } from 'clsx';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import {
  Alert,
  Button,
  EmptyState,
  ListToolbar,
  Loading,
  Screen,
  StackedList,
} from '@/shared/ui';

import { formatSyncedAt } from '../components/format';
import { PriceApprovalCard } from '../components/price-approval-card';
import { PriceApprovalListSkeleton } from '../components/price-approval-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useIsOnline } from '../hooks/use-is-online';
import { usePriceApprovals } from '../hooks/use-price-approvals';
import { usePriceApprovalFilter } from '../store/priceApprovalFilterStore';

export function PriceApprovalListScreen() {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const filter = usePriceApprovalFilter((state) => state.filter);
  const setFilter = usePriceApprovalFilter((state) => state.setFilter);
  const online = useIsOnline();
  const {
    data,
    error,
    fetchStatus,
    dataUpdatedAt,
    isRefetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePriceApprovals(filter, search);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  return (
    <Screen>
      <View className="pb-4 pt-2">
        <ListToolbar search={{ value: query, onChange: setQuery, placeholder: 'Search requests' }}>
          <StatusFilter value={filter} onChange={setFilter} />
        </ListToolbar>
      </View>
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load requests"
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
          <PriceApprovalListSkeleton />
        )
      ) : (
        <>
          {!online ? (
            <Alert
              tone="warning"
              message={`You are offline. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              className="mx-5 mt-4"
            />
          ) : error ? (
            <Alert
              tone="warning"
              message={`Could not refresh. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              className="mx-5 mt-4"
            />
          ) : null}
          <StackedList
            data={data}
            keyExtractor={(item) => item.pa_uuid}
            renderItem={({ item }) => <PriceApprovalCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="clipboard"
                title="Nothing here"
                description={
                  search
                    ? 'No requests match your search.'
                    : filter === 'all'
                      ? 'No price requests yet.'
                      : 'No requests with this status.'
                }
              />
            }
            contentContainerClassName={clsx('gap-4 px-5 py-4', data.length === 0 && 'grow')}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? <Loading label="Loading more requests" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
