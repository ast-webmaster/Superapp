import { clsx } from 'clsx';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { formatSyncedAt } from '@/shared/utils/format';
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

import { ExportSheet } from '../components/export-sheet';
import { FilterSheet } from '../components/filter-sheet';
import { KindSwitch } from '../components/kind-switch';
import { MarketingPromoCard } from '../components/marketing-promo-card';
import { MarketingPromoListSkeleton } from '../components/marketing-promo-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useMarketingPromos } from '../hooks/use-marketing-promos';
import { countSheetFilters, useMarketingPromoFilter } from '../store/marketingPromoFilterStore';

export function MarketingPromoListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const kind = useMarketingPromoFilter((state) => state.kind);
  const setKind = useMarketingPromoFilter((state) => state.setKind);
  const filters = useMarketingPromoFilter((state) => state.filters);
  const setFilters = useMarketingPromoFilter((state) => state.setFilters);
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
  } = useMarketingPromos(kind, filters, search);

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
      <ExportSheet kind={kind} visible={exporting} onClose={() => setExporting(false)} />
      <View className="gap-3 pb-4 pt-2">
        <KindSwitch value={kind} onChange={setKind} />
        <ListToolbar
          search={{
            open: searching,
            onClose: () => setSearching(false),
            value: query,
            onChange: setQuery,
            placeholder: 'Search promos',
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
            title="Could not load promos"
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
          <MarketingPromoListSkeleton />
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
            renderItem={({ item }) => <MarketingPromoCard item={item} kind={kind} />}
            ListEmptyComponent={
              <EmptyState
                icon="star"
                title="Nothing here"
                description={
                  search
                    ? 'No promos match your search.'
                    : filters.status.length === 0
                      ? 'No marketing promos yet.'
                      : 'No promos with this status.'
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
              isFetchingNextPage ? <Loading label="Loading more promos" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
