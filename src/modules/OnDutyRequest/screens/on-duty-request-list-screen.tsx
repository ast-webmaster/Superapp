import { clsx } from 'clsx';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useCan } from '@/core/permissions';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { formatSyncedAt } from '@/shared/utils/format';
import {
  Alert,
  Button,
  EmptyState,
  Fab,
  IconButton,
  ListToolbar,
  Loading,
  Screen,
  StackedList,
} from '@/shared/ui';

import { FilterSheet } from '../components/filter-sheet';
import { OnDutyRequestCard } from '../components/on-duty-request-card';
import { OnDutyRequestListSkeleton } from '../components/on-duty-request-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useOnDutyRequests } from '../hooks/use-on-duty-requests';
import { onDutyRequestRoutes } from '../navigation/routes';
import { countSheetFilters, useOnDutyRequestFilter } from '../store/onDutyRequestFilterStore';

export function OnDutyRequestListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useOnDutyRequestFilter((state) => state.filters);
  const setFilters = useOnDutyRequestFilter((state) => state.setFilters);
  const can = useCan();
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
  } = useOnDutyRequests(filters, search);

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
      <FilterSheet visible={filtering} onClose={() => setFiltering(false)} />
      <View className="pb-4 pt-2">
        <ListToolbar
          search={{
            open: searching,
            onClose: () => setSearching(false),
            value: query,
            onChange: setQuery,
            placeholder: 'Search requests',
          }}
          onFilter={() => setFiltering(true)}
          filterCount={countSheetFilters(filters)}>
          <StatusFilter value={filters.status} onChange={(status) => setFilters({ status })} />
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
          <OnDutyRequestListSkeleton />
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
            keyExtractor={(item) => item.uuid}
            renderItem={({ item }) => <OnDutyRequestCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="map"
                title="Nothing here"
                description={
                  search
                    ? 'No requests match your search.'
                    : filters.status === 'all'
                      ? 'No on duty requests yet.'
                      : 'No requests with this status.'
                }
              />
            }
            contentContainerClassName={clsx('gap-4 px-5 pb-28 pt-4', data.length === 0 && 'grow')}
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
      {can('create_on_duty_request') ? (
        <Fab
          label="New on duty request"
          onPress={() => router.push(onDutyRequestRoutes.create as never)}
        />
      ) : null}
    </Screen>
  );
}
