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

import { ExportSheet } from '../components/export-sheet';
import { countSheetFilters, FilterSheet } from '../components/filter-sheet';
import { RequestDesignCard } from '../components/request-design-card';
import { RequestDesignListSkeleton } from '../components/request-design-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useRequestDesigns } from '../hooks/use-request-designs';
import { requestDesignRoutes } from '../navigation/routes';
import { useRequestDesignFilter } from '../store/requestDesignFilterStore';

const ANALYTICS_PERMISSIONS = ['analytics_requestdesign', 'analytics_all_requestdesign'] as const;

export function RequestDesignListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useRequestDesignFilter((state) => state.filters);
  const setFilters = useRequestDesignFilter((state) => state.setFilters);
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
  } = useRequestDesigns(filters, search);

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
              {can(ANALYTICS_PERMISSIONS) ? (
                <IconButton
                  size="sm"
                  icon="chart"
                  label="Analytics"
                  onPress={() => router.push(requestDesignRoutes.analytics as never)}
                />
              ) : null}
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
            placeholder: 'Search by number, description or requester',
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
          <RequestDesignListSkeleton />
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
            renderItem={({ item }) => <RequestDesignCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="pencil"
                title="Nothing here"
                description={
                  search
                    ? 'No requests match your search.'
                    : filters.status === 'all'
                      ? 'No design requests yet.'
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
      {can('create_requestdesign') ? (
        <Fab label="New request" onPress={() => router.push(requestDesignRoutes.create as never)} />
      ) : null}
    </Screen>
  );
}
