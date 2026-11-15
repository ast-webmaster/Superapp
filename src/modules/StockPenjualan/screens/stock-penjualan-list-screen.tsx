import { clsx } from 'clsx';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import {
  Alert,
  AppText,
  Button,
  EmptyState,
  IconButton,
  ListToolbar,
  Loading,
  Screen,
  StackedList,
} from '@/shared/ui';
import { formatDateTime, formatSyncedAt } from '@/shared/utils/format';

import { FilterSheet } from '../components/filter-sheet';
import { StockCard } from '../components/stock-card';
import { StockListSkeleton } from '../components/stock-skeletons';
import { TypeFilter } from '../components/type-filter';
import { useExportStock } from '../hooks/use-export-stock';
import { useStockItems } from '../hooks/use-stock-items';
import { useStockPenjualanFilter } from '../store/stockPenjualanFilterStore';

export function StockPenjualanListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useStockPenjualanFilter((state) => state.filters);
  const setFilters = useStockPenjualanFilter((state) => state.setFilters);
  const online = useIsOnline();
  const exportStock = useExportStock();
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
  } = useStockItems(filters, search);

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
            placeholder: 'Search product code or name',
          }}
          onFilter={() => setFiltering(true)}
          filterActive={filters.categoryCode !== null}
          actions={[
            {
              key: 'export',
              label: 'Export to Excel',
              icon: 'download',
              onPress: () => {
                if (!exportStock.isPending) exportStock.mutate();
              },
            },
          ]}>
          {/* Only the all-offices view has a stock type to choose; sales never sees these. */}
          {data?.view === 'all' ? (
            <TypeFilter value={filters.type} onChange={(type) => setFilters({ type })} />
          ) : null}
        </ListToolbar>
      </View>
      {exportStock.isPending ? <Loading label="Preparing Excel file" /> : null}
      {exportStock.error ? (
        <Alert
          tone="danger"
          message={`Could not export. ${toAppError(exportStock.error).message}`}
          onDismiss={exportStock.reset}
          className="mx-5 mb-4"
        />
      ) : null}
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load stock"
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
          <StockListSkeleton />
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
            data={data.items}
            keyExtractor={(item) => item.product_code}
            renderItem={({ item }) => <StockCard item={item} />}
            ListHeaderComponent={
              data.lastUpdatedAt ? (
                <AppText variant="caption" tone="muted">
                  {`Stock as of ${formatDateTime(data.lastUpdatedAt)}`}
                </AppText>
              ) : undefined
            }
            ListEmptyComponent={
              <EmptyState
                icon="box"
                title="Nothing here"
                description={
                  search || filters.categoryCode
                    ? 'No products match your search or filter.'
                    : 'No stock to show yet.'
                }
              />
            }
            contentContainerClassName={clsx(
              'gap-4 px-5 pb-8 pt-4',
              data.items.length === 0 && 'grow',
            )}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? <Loading label="Loading more products" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
