import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { DetailActions, hasDetailActions } from '../components/detail-actions';
import { QueryStatus } from '../components/query-status';
import { SalesVisitationDetailSkeleton } from '../components/sales-visitation-skeletons';
import {
  CheckInSection,
  CheckOutSection,
  InfoSection,
  PlanSection,
  SummarySection,
} from '../components/sales-visitation-detail-sections';
import { useSalesVisitation } from '../hooks/use-sales-visitation';

export function SalesVisitationDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } =
    useSalesVisitation(uuid);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="this visit"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <SalesVisitationDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);

  return (
    <Screen>
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          // The action bar owns the bottom inset when it is shown.
          paddingBottom: hasDetailActions(data) ? sizes.screenTopGap : bottom + sizes.screenTopGap,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }>
        {!online ? (
          <Alert tone="warning" message={`You are offline. Showing data from ${syncedAt}.`} />
        ) : error ? (
          <Alert tone="warning" message={`Could not refresh. Showing data from ${syncedAt}.`} />
        ) : null}
        <SummarySection detail={data} />
        <InfoSection detail={data} />
        <PlanSection detail={data} />
        <CheckInSection detail={data} />
        <CheckOutSection detail={data} />
      </ScrollView>
      <DetailActions detail={data} online={online} />
    </Screen>
  );
}
