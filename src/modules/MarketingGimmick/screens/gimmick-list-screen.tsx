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

import { countSheetFilters, FilterSheet } from '../components/filter-sheet';
import { GimmickCard } from '../components/gimmick-card';
import { GimmickListSkeleton } from '../components/gimmick-skeletons';
import { StatusFilter } from '../components/status-filter';
import { flows } from '../flows';
import { useGimmicks } from '../hooks/use-gimmicks';
import { gimmickRoutes } from '../navigation/routes';
import { useGimmickFilter } from '../store/marketingGimmickFilterStore';
import type { GimmickFlow } from '../types';

export function GimmickListScreen({ flow: flowKey }: { flow: GimmickFlow }) {
  const flow = flows[flowKey];
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useGimmickFilter((state) => state.filters[flowKey]);
  const setFilters = useGimmickFilter((state) => state.setFilters);
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
  } = useGimmicks(flowKey, filters, search);

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
      <FilterSheet flow={flow} visible={filtering} onClose={() => setFiltering(false)} />
      <View className="pb-4 pt-2">
        <ListToolbar
          search={{
            open: searching,
            onClose: () => setSearching(false),
            value: query,
            onChange: setQuery,
            placeholder: `Search ${flow.noun} documents`,
          }}
          onFilter={() => setFiltering(true)}
          filterCount={countSheetFilters(flow, filters)}>
          <StatusFilter
            flow={flow}
            value={filters.status}
            onChange={(status) => setFilters(flowKey, { status })}
          />
        </ListToolbar>
      </View>
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load documents"
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
          <GimmickListSkeleton />
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
            renderItem={({ item }) => <GimmickCard flow={flowKey} item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="box"
                title="Nothing here"
                description={
                  search
                    ? 'No documents match your search.'
                    : filters.status === 'all'
                      ? `No ${flow.noun} documents yet.`
                      : 'No documents with this status.'
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
              isFetchingNextPage ? <Loading label="Loading more documents" /> : undefined
            }
          />
        </>
      )}
      {can(flow.createPermission) ? (
        <Fab
          label={flow.createLabel}
          onPress={() => router.push(gimmickRoutes.create(flowKey) as never)}
        />
      ) : null}
    </Screen>
  );
}
