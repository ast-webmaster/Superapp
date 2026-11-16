import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Button, EmptyState, IconButton, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { ApprovalActions } from '../components/approval-actions';
import {
  AttachmentsSection,
  CostsSection,
  FinanceSection,
  HistorySection,
  InfoSection,
  SalesRevenueSection,
  SummarySection,
  SupportShareSection,
  TargetsSection,
} from '../components/marketing-activity-detail-sections';
import { MarketingActivityDetailSkeleton } from '../components/marketing-activity-skeletons';
import { useMarketingActivity } from '../hooks/use-marketing-activity';
import { useMarketingActivityFile } from '../hooks/use-marketing-activity-file';

export function MarketingActivityDetailScreen() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>();
  // A document lives in one group; the route names it, and Single is the default.
  const kind = kindParam === 'combination' ? 'combination' : 'single';
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useMarketingActivity(
    kind,
    id,
  );
  const { download, pending } = useMarketingActivityFile(kind, id);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  if (data === undefined) {
    return (
      <Screen>
        {error ? (
          toAppError(error).code === 'not_found' ? (
            <EmptyState
              icon="calendar"
              title="Activity not found"
              description="It may have been removed, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this activity"
              description={toAppError(error).message}>
              {retry}
            </EmptyState>
          )
        ) : fetchStatus === 'paused' ? (
          <EmptyState
            icon="alert"
            title="You are offline"
            description="Check your connection and try again.">
            {retry}
          </EmptyState>
        ) : (
          <MarketingActivityDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              size="sm"
              icon="download"
              label="Download PDF"
              disabled={pending?.type === 'pdf'}
              onPress={() =>
                download({ type: 'pdf', name: `${data.activity_no.replace(/\//g, '-')}.pdf` })
              }
            />
          ),
        }}
      />
      {/* Under the native stack header: no top inset, only the standard gap. */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          // The decision bar owns the bottom inset when it is shown.
          paddingBottom:
            data.allowed_actions.length > 0 ? sizes.screenTopGap : bottom + sizes.screenTopGap,
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
        <SupportShareSection detail={data} />
        <CostsSection detail={data} />
        <TargetsSection detail={data} />
        <SalesRevenueSection detail={data} />
        <FinanceSection detail={data} />
        <AttachmentsSection detail={data} onDownload={download} pending={pending} />
        <HistorySection detail={data} />
      </ScrollView>
      <ApprovalActions kind={kind} detail={data} online={online} />
    </Screen>
  );
}
