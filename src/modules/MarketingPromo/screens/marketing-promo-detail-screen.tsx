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
  CostsSection,
  FilesSection,
  HistorySection,
  InfoSection,
  SummarySection,
  SupportShareSection,
  TargetSection,
} from '../components/marketing-promo-detail-sections';
import { MarketingPromoDetailSkeleton } from '../components/marketing-promo-skeletons';
import { useMarketingPromo } from '../hooks/use-marketing-promo';
import { useMarketingPromoFile } from '../hooks/use-marketing-promo-file';

export function MarketingPromoDetailScreen() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>();
  // A document lives in one group; the route names it, and Single is the default.
  const kind = kindParam === 'combination' ? 'combination' : 'single';
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useMarketingPromo(
    kind,
    id,
  );
  const { download, pending } = useMarketingPromoFile(kind, id);

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
              icon="star"
              title="Promo not found"
              description="It may have been removed, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this promo"
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
          <MarketingPromoDetailSkeleton />
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
                download({ type: 'pdf', name: `${data.promo_no.replace(/\//g, '-')}.pdf` })
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
        <TargetSection detail={data} />
        <FilesSection detail={data} onDownload={download} pending={pending} />
        <HistorySection detail={data} />
      </ScrollView>
      <ApprovalActions kind={kind} detail={data} online={online} />
    </Screen>
  );
}
