import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, Button, EmptyState, Screen, SegmentedControl } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { AuditActions } from '../components/audit-actions';
import { AuditDetailSkeleton } from '../components/audit-skeletons';
import { AuditSummary } from '../components/audit-summary';
import { FindingTab } from '../components/finding-tab';
import { HistoryTab } from '../components/history-tab';
import { OverviewTab } from '../components/overview-tab';
import { ProgramTab } from '../components/program-tab';
import { useAudit } from '../hooks/use-audit';

const VIEWS = [
  { value: 'overview', label: 'Overview' },
  { value: 'program', label: 'Program' },
  { value: 'findings', label: 'Findings' },
  { value: 'history', label: 'History' },
] as const;

type DetailView = (typeof VIEWS)[number]['value'];

export function AuditDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const [view, setView] = useState<DetailView>('overview');
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useAudit(id);

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
              icon="eye"
              title="Audit not found"
              description="It may have been removed, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this audit"
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
          <AuditDetailSkeleton />
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
        <AuditSummary detail={data} />
        <SegmentedControl
          label="Show"
          fullWidth
          options={[VIEWS[0], VIEWS[1], VIEWS[2], VIEWS[3]]}
          value={view}
          onChange={(next) => setView(next as DetailView)}
        />
        {view === 'overview' ? <OverviewTab detail={data} online={online} /> : null}
        {view === 'program' ? <ProgramTab uuid={data.uuid} /> : null}
        {view === 'findings' ? <FindingTab uuid={data.uuid} online={online} /> : null}
        {view === 'history' ? <HistoryTab uuid={data.uuid} /> : null}
      </ScrollView>
      <AuditActions detail={data} online={online} />
    </Screen>
  );
}
