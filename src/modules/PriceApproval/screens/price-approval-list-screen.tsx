import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';

import { toAppError } from '@/core/errors';
import { EmptyState } from '@/shared/components/empty-state';
import { ErrorState } from '@/shared/components/error-state';
import { Loading } from '@/shared/components/loading';
import { Screen } from '@/shared/components/screen';
import { ThemedText } from '@/shared/components/themed-text';
import { Spacing } from '@/shared/theme';

import { PriceApprovalCard } from '../components/price-approval-card';
import { StatusFilter } from '../components/status-filter';
import { usePriceApprovals } from '../hooks/use-price-approvals';
import { usePriceApprovalFilter } from '../store/priceApprovalFilterStore';

export function PriceApprovalListScreen() {
  const filter = usePriceApprovalFilter((state) => state.filter);
  const setFilter = usePriceApprovalFilter((state) => state.setFilter);
  const { data, error, fetchStatus, isRefetching, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePriceApprovals(filter);

  return (
    <Screen hasHeader>
      <StatusFilter value={filter} onChange={setFilter} />
      {data === undefined ? (
        error ? (
          <ErrorState message={toAppError(error).message} onRetry={() => refetch()} />
        ) : fetchStatus === 'paused' ? (
          <ErrorState message="You are offline." onRetry={() => refetch()} />
        ) : (
          <Loading />
        )
      ) : (
        <>
          {error ? (
            <ThemedText type="small" themeColor="danger">
              Could not refresh. Showing saved data.
            </ThemedText>
          ) : null}
          <FlatList
            data={data}
            keyExtractor={(item) => item.pa_uuid}
            renderItem={({ item }) => <PriceApprovalCard item={item} />}
            ListEmptyComponent={
              <EmptyState
                title="Nothing here"
                description={filter === 'all' ? 'No price requests yet.' : 'No requests with this status.'}
              />
            }
            contentContainerStyle={[styles.list, data.length === 0 && styles.emptyList]}
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => refetch()}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
            }}
            ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  emptyList: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: Spacing.three,
  },
});
