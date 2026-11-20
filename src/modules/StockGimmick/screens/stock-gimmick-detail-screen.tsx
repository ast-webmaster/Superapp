import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { QueryStatus } from '../components/query-status';
import {
  MovementsSection,
  StockSection,
  SummarySection,
} from '../components/stock-detail-sections';
import { StockDetailSkeleton } from '../components/stock-skeletons';
import { useStockGimmick } from '../hooks/use-stock-gimmick';
import { useStockMovements } from '../hooks/use-stock-movements';

export function StockGimmickDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useStockGimmick(id);
  const movements = useStockMovements(id);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <StockDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);

  return (
    <Screen>
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || movements.isRefetching}
            onRefresh={() => void Promise.all([refetch(), movements.refetch()])}
            tintColor={colors.primary}
          />
        }>
        {!online ? (
          <Alert tone="warning" message={`You are offline. Showing data from ${syncedAt}.`} />
        ) : error ? (
          <Alert tone="warning" message={`Could not refresh. Showing data from ${syncedAt}.`} />
        ) : null}
        <SummarySection detail={data} />
        <StockSection detail={data} />
        <MovementsSection
          track={movements.data}
          error={movements.error}
          offline={movements.fetchStatus === 'paused'}
          onRetry={() => void movements.refetch()}
        />
      </ScrollView>
    </Screen>
  );
}
