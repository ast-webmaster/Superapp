import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Button,
  Chip,
  EmptyState,
  ListToolbar,
  Loading,
  Screen,
} from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

import { BarList } from '../components/charts/bar-list';
import { GroupCard } from '../components/group-card';
import { currentPeriod, expectedShare } from '../components/level';
import { PeriodSheet } from '../components/period-sheet';
import { ReportSkeleton } from '../components/report-skeletons';
import { TotalCard } from '../components/total-card';
import { useExportReport, type ExportFormat } from '../hooks/use-export-report';
import { useReportSummary } from '../hooks/use-report-summary';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';
import type { ReportSummary } from '../types';

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View className="gap-1 pt-2">
      <AppText variant="title" role="heading">
        {title}
      </AppText>
      {note ? (
        <AppText variant="caption" tone="muted">
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

function Report({ summary }: { summary: ReportSummary }) {
  // Every group counts the same sales days (the server takes them from the whole period).
  const daysDone = summary.groups[0]?.weekly.reduce((sum, week) => sum + week.dates.length, 0) ?? 0;
  const expected = (dayLeft: number) =>
    expectedShare(summary.period, daysDone, dayLeft, currentPeriod());
  const showsExpected = summary.groups.some((group) => expected(group.target.day_left) !== null);

  return (
    <>
      <TotalCard summary={summary} />
      <SectionTitle
        title="Groups"
        note={showsExpected ? 'The dark tick marks where sales should be by now.' : undefined}
      />
      {summary.groups.map((group) => (
        <GroupCard key={group.group} group={group} expected={expected(group.target.day_left)} />
      ))}
      {summary.branches.length > 0 ? (
        <>
          <SectionTitle title="Sales by branch" note="All groups together, largest first." />
          <View className="rounded-xl border border-border bg-surface p-4">
            <BarList
              items={summary.branches.map((item) => ({
                key: item.branch,
                label: item.branch,
                value: item.achievement,
              }))}
            />
          </View>
        </>
      ) : null}
    </>
  );
}

export function LaporanPenjualanScreen() {
  const { bottom } = useSafeAreaInsets();
  const [choosingPeriod, setChoosingPeriod] = useState(false);
  const period = useLaporanPenjualanPeriod((state) => state.period);
  const online = useIsOnline();
  const exportReport = useExportReport();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, isPlaceholderData, refetch } =
    useReportSummary(period);

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  const download = (format: ExportFormat) => {
    if (data && !exportReport.isPending) exportReport.mutate({ format, period: data.period });
  };

  return (
    <Screen>
      <PeriodSheet visible={choosingPeriod} onClose={() => setChoosingPeriod(false)} />
      <View className="pb-4 pt-2">
        <ListToolbar
          actions={
            data
              ? [
                  {
                    key: 'xlsx',
                    label: 'Export to Excel',
                    icon: 'download',
                    onPress: () => download('xlsx'),
                  },
                  {
                    key: 'pdf',
                    label: 'Export to PDF',
                    icon: 'doc',
                    onPress: () => download('pdf'),
                  },
                ]
              : []
          }>
          <Chip
            icon="calendar"
            label={data?.label ?? 'Latest'}
            selected
            aria-label={`Period, ${data?.label ?? 'latest'}. Change period`}
            onPress={() => setChoosingPeriod(true)}
          />
        </ListToolbar>
      </View>
      {exportReport.isPending ? <Loading label="Preparing file" /> : null}
      {exportReport.error ? (
        <Alert
          tone="danger"
          message={`Could not export. ${toAppError(exportReport.error).message}`}
          onDismiss={exportReport.reset}
          className="mx-5 mb-4"
        />
      ) : null}
      {data === undefined ? (
        error ? (
          <EmptyState
            icon="alert"
            title="Could not load the report"
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
          <ReportSkeleton />
        )
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: bottom + sizes.screenTopGap, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isPlaceholderData}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }>
          {isPlaceholderData ? (
            <Loading label="Loading period" />
          ) : !online ? (
            <Alert
              tone="warning"
              message={`You are offline. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
            />
          ) : error ? (
            <Alert
              tone="warning"
              message={`Could not refresh. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
            />
          ) : null}
          {data.groups.length > 0 ? (
            <Report summary={data} />
          ) : (
            <EmptyState
              icon="chart"
              title="No sales yet"
              description={`Nothing has been recorded for ${data.label}.`}
            />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
