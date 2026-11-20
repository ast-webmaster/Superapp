import { clsx } from 'clsx';
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
  IconButton,
  InfoCard,
  ListToolbar,
  Loading,
  Screen,
  StackedList,
} from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { AuditCard } from '../components/audit-card';
import { AuditListSkeleton } from '../components/audit-skeletons';
import { FilterSheet } from '../components/filter-sheet';
import { TabFilter } from '../components/tab-filter';
import { useAuditActionCount } from '../hooks/use-audit-action-count';
import { useAudits } from '../hooks/use-audits';
import { countSheetFilters, useAuditFilter } from '../store/auditFilterStore';

export function AuditListScreen() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const search = useDebouncedValue(query.trim());
  const filters = useAuditFilter((state) => state.filters);
  const setFilters = useAuditFilter((state) => state.setFilters);
  const can = useCan();
  const online = useIsOnline();
  const waiting = useAuditActionCount().data ?? 0;
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
  } = useAudits(filters, search);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  // The cards waiting for the user are in the approver's queue or in the Responsibility's.
  const waitingTab = can('approve_audit') ? 'approval' : 'follow_up';

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
            placeholder: 'Search audits',
          }}
          onFilter={() => setFiltering(true)}
          filterCount={countSheetFilters(filters)}>
          <TabFilter value={filters.tab} onChange={(tab) => setFilters({ tab })} />
        </ListToolbar>
      </View>
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load audits"
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
          <AuditListSkeleton />
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
          {waiting > 0 && filters.tab !== waitingTab ? (
            <InfoCard
              icon="bell"
              title={
                waiting === 1
                  ? '1 audit is waiting for you'
                  : `${waiting} audits are waiting for you`
              }
              description="Show them"
              onPress={() => setFilters({ tab: waitingTab })}
              className="mx-5 mt-4"
            />
          ) : null}
          <StackedList
            data={data}
            keyExtractor={(item) => item.uuid}
            renderItem={({ item }) => <AuditCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                icon="eye"
                title="Nothing here"
                description={search ? 'No audits match your search.' : 'No audits to show.'}
              />
            }
            contentContainerClassName={clsx('gap-4 px-5 pb-28 pt-4', data.length === 0 && 'grow')}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            ListFooterComponent={
              isFetchingNextPage ? <Loading label="Loading more audits" /> : undefined
            }
          />
        </>
      )}
    </Screen>
  );
}
