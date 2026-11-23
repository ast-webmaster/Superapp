import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Screen } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { DetailActions, hasDetailActions } from '../components/detail-actions';
import {
  FilesSection,
  HistorySection,
  InfoSection,
  ItemsSection,
  SummarySection,
} from '../components/gimmick-detail-sections';
import { GimmickDetailSkeleton } from '../components/gimmick-skeletons';
import { QueryStatus } from '../components/query-status';
import { flows } from '../flows';
import { useGimmick } from '../hooks/use-gimmick';
import { useGimmickFile } from '../hooks/use-gimmick-file';
import type { GimmickFlow } from '../types';

export function GimmickDetailScreen({ flow: flowKey }: { flow: GimmickFlow }) {
  const flow = flows[flowKey];
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useGimmick(
    flowKey,
    uuid,
  );
  const files = useGimmickFile(flowKey, uuid);

  if (data === undefined) {
    return (
      <Screen>
        {error || fetchStatus === 'paused' ? (
          <QueryStatus
            subject="this document"
            error={error}
            offline={fetchStatus === 'paused'}
            onRetry={() => void refetch()}
          />
        ) : (
          <GimmickDetailSkeleton />
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
        <FilesSection
          flow={flow}
          files={data.attachments}
          pending={files.pending}
          onDownload={files.download}
        />
        <HistorySection steps={data.approvements} />
      </ScrollView>
      <DetailActions flow={flow} detail={data} online={online} />
    </Screen>
  );
}
