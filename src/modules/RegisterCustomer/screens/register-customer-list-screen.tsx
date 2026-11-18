import { clsx } from 'clsx';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useCan } from '@/core/permissions';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useIsOnline } from '@/shared/hooks/use-is-online';
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
import { formatSyncedAt } from '@/shared/utils/format';

import { ExportSheet } from '../components/export-sheet';
import { FilterSheet } from '../components/filter-sheet';
import { RegisterCustomerCard } from '../components/register-customer-card';
import { RegisterCustomerListSkeleton } from '../components/register-customer-skeletons';
import { StatusFilter } from '../components/status-filter';
import { useRegisterCustomers } from '../hooks/use-register-customers';
import { registerCustomerRoutes } from '../navigation/routes';
import {
  countSheetFilters,
  useRegisterCustomerFilter,
} from '../store/registerCustomerFilterStore';

export function RegisterCustomerListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useRegisterCustomerFilter((state) => state.filters);
  const setFilters = useRegisterCustomerFilter((state) => state.setFilters);
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
  } = useRegisterCustomers(filters, search);

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
            placeholder: 'Search registrations',
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
            title="Could not load registrations"
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
          <RegisterCustomerListSkeleton />
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
            renderItem={({ item }) => <RegisterCustomerCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="users"
                title="Nothing here"
                description={
                  search
                    ? 'No registrations match your search.'
                    : filters.status === 'all'
                      ? 'No customer registrations yet.'
                      : 'No registrations with this status.'
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
              isFetchingNextPage ? <Loading label="Loading more registrations" /> : undefined
            }
          />
        </>
      )}
      {can('create_registercustomer') ? (
        <Fab
          label="New registration"
          onPress={() => router.push(registerCustomerRoutes.create as never)}
        />
      ) : null}
    </Screen>
  );
}
