import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { DetailActions, hasDetailActions } from '../components/detail-actions';
import {
  HistorySection,
  InfoSection,
  ItemsSection,
  PdfSection,
  SummarySection,
} from '../components/product-borrowing-detail-sections';
import { ProductBorrowingDetailSkeleton } from '../components/product-borrowing-skeletons';
import { QueryStatus } from '../components/query-status';
import { useProductBorrowing } from '../hooks/use-product-borrowing';
import { useProductBorrowingPdf } from '../hooks/use-product-borrowing-pdf';

export function ProductBorrowingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } =
    useProductBorrowing(id);
  const pdf = useProductBorrowingPdf(id, data?.product_borrowing_no ?? id);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="this borrowing"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <ProductBorrowingDetailSkeleton />
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
        <ItemsSection detail={data} />
        <PdfSection busy={pdf.isPending} onPress={() => pdf.mutate()} />
        <HistorySection steps={data.approvements} />
      </ScrollView>
      <DetailActions detail={data} online={online} />
    </Screen>
  );
}
