import { clsx } from 'clsx';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useCan } from '@/core/permissions';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
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

import { ExportSheet } from '../components/export-sheet';
import { FilterSheet } from '../components/filter-sheet';
import { formatSyncedAt } from '../components/format';
import { priceApprovalRoutes } from '../navigation/routes';
import { PriceApprovalCard } from '../components/price-approval-card';
import { PriceApprovalListSkeleton } from '../components/price-approval-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { usePriceApprovals } from '../hooks/use-price-approvals';
import { hasSheetFilters, usePriceApprovalFilter } from '../store/priceApprovalFilterStore';

export function PriceApprovalListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = usePriceApprovalFilter((state) => state.filters);
  const setFilters = usePriceApprovalFilter((state) => state.setFilters);
  const [filtering, setFiltering] = useState(false);
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
  } = usePriceApprovals(filters, search);

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
            <>
              <IconButton
                size="sm"
                icon="download"
                label="Export"
                onPress={() => setExporting(true)}
              />
              <IconButton
                size="sm"
                icon="search"
                label="Search"
                active={searching || query !== ''}
                onPress={() => setSearching(true)}
              />
            </>
          ),
        }}
      />
      <FilterSheet visible={filtering} onClose={() => setFiltering(false)} />
      <ExportSheet visible={exporting} onClose={() => setExporting(false)} />
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
          filterActive={hasSheetFilters(filters)}>
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
                    : filters.status === 'all'
                      ? 'No price requests yet.'
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
      {can('create_priceapproval') ? (
        <Fab
          label="New price request"
          onPress={() => router.push(priceApprovalRoutes.create as never)}
        />
      ) : null}
    </Screen>
  );
}
