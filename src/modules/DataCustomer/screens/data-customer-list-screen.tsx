import { clsx } from 'clsx';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  ListToolbar,
  Loading,
  Screen,
  StackedList,
} from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { CustomerCard } from '../components/customer-card';
import { CustomerListSkeleton } from '../components/customer-skeletons';
import { useDataCustomers } from '../hooks/use-data-customers';

export function DataCustomerListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const search = useDebouncedValue(query.trim());
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
  } = useDataCustomers(search);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              size="sm"
              icon="search"
              label="Search"
              active={searching || query !== ''}
              onPress={() => setSearching(true)}
            />
          ),
        }}
      />
      {searching ? (
        <View className="pb-4 pt-2">
          <ListToolbar
            search={{
              open: searching,
              onClose: () => setSearching(false),
              value: query,
              onChange: setQuery,
              placeholder: 'Search name or code',
            }}
          />
        </View>
      ) : null}
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load customers"
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
          <CustomerListSkeleton />
        )
      ) : (
        <>
          {!online ? (
            <Alert
              tone="warning"
              message={`You are offline. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              className="mx-5"
            />
          ) : error ? (
            <Alert
              tone="warning"
              message={`Could not refresh. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
              className="mx-5"
            />
          ) : null}
          <StackedList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <CustomerCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="building"
                title="Nothing here"
                description={
                  search ? 'No customers match your search.' : 'There are no customers yet.'
                }
              />
            }
            contentContainerClassName={clsx('gap-4 px-5 pb-8 pt-4', data.length === 0 && 'grow')}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? <Loading label="Loading more customers" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
