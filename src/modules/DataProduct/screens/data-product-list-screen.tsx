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

import { FilterSheet } from '../components/filter-sheet';
import { ProductCard } from '../components/product-card';
import { ProductListSkeleton } from '../components/product-skeletons';
import { useDataProducts } from '../hooks/use-data-products';
import { useDataProductFilter } from '../store/dataProductFilterStore';

export function DataProductListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useDataProductFilter((state) => state.filters);
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
  } = useDataProducts(filters, search);

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
            placeholder: 'Search name, code or SKU',
          }}
          onFilter={() => setFiltering(true)}
          filterCount={filters.categoryCode !== null ? 1 : 0}
        />
      </View>
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load products"
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
          <ProductListSkeleton />
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
            renderItem={({ item }) => <ProductCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="box"
                title="Nothing here"
                description={
                  search || filters.categoryCode
                    ? 'No products match your search or filter.'
                    : 'There are no products yet.'
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
              isFetchingNextPage ? <Loading label="Loading more products" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
