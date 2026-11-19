import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { DetailActions, hasDetailActions } from '../components/detail-actions';
import {
  CostsSection,
  DeclarationSection,
  DestinationsSection,
  FilesSection,
  HistorySection,
  InfoSection,
  SummarySection,
} from '../components/on-duty-request-detail-sections';
import { OnDutyRequestDetailSkeleton } from '../components/on-duty-request-skeletons';
import { QueryStatus } from '../components/query-status';
import { useOnDutyRequest } from '../hooks/use-on-duty-request';
import { useOnDutyRequestFile } from '../hooks/use-on-duty-request-file';

export function OnDutyRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useOnDutyRequest(id);
  const { download, pending } = useOnDutyRequestFile(id);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="this request"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <OnDutyRequestDetailSkeleton />
        )}
      </Screen>
    );
  }

  const syncedAt = formatSyncedAt(dataUpdatedAt);
  const files = { onDownload: download, pending };

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
        <DestinationsSection detail={data} />
        <CostsSection detail={data} {...files} />
        <FilesSection detail={data} {...files} />
        <HistorySection title="Approval history" steps={data.approvements} />
        <DeclarationSection detail={data} />
      </ScrollView>
      <DetailActions detail={data} online={online} />
    </Screen>
  );
}
