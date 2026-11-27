import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { sizes } from '@/shared/theme/tokens';
import {
  Alert,
  Button,
  EmptyState,
  IconButton,
  ListGroup,
  ListRow,
  Loading,
  Screen,
  SegmentedControl,
  Sheet,
  type IconName,
} from '@/shared/ui';
import { formatMonth, formatSyncedAt } from '@/shared/utils/format';

import { AreaChart } from '../components/charts/area-chart';
import { BranchShares } from '../components/branch-shares';
import { GroupCard } from '../components/group-card';
import { FullAmountsRow } from '../components/full-amounts-row';
import { filterGroups, GroupFilter, NO_GROUP_FILTERS } from '../components/group-filter';
import { PeriodChips } from '../components/period-chips';
import { ReportCard } from '../components/report-card';
import { ReportSkeleton } from '../components/report-skeletons';
import { TileGrid } from '../components/ticker-tile';
import { TotalCard } from '../components/total-card';
import { useExportReport, type ExportFormat } from '../hooks/use-export-report';
import { useRefreshReport } from '../hooks/use-refresh-report';
import { canRefresh, nextRefreshAt } from '../hooks/report-freshness';
import { useReportSummary } from '../hooks/use-report-summary';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';
import type { ReportSummary } from '../types';

const exportActions: readonly { format: ExportFormat; label: string; icon: IconName }[] = [
  { format: 'xlsx', label: 'Export to Excel', icon: 'download' },
  { format: 'pdf', label: 'Export to PDF', icon: 'doc' },
];

/** The report by group, or each branch's share of sales: the floating switch. */
const VIEWS = [
  { value: 'group', label: 'Group' },
  { value: 'branch', label: 'Branch' },
] as const;

function Report({ summary, view }: { summary: ReportSummary; view: string }) {
  const [filters, setFilters] = useState(NO_GROUP_FILTERS);
  const groups = filterGroups(summary.groups, filters);
  const dailyTarget = summary.groups.reduce((sum, group) => sum + group.target.daily_amount, 0);
  const dailyTotals = summary.daily_totals ?? [];

  return (
    <>
      {view === 'branch' ? (
        summary.branches.length > 0 ? (
          <BranchShares
            items={summary.branches.map((item) => ({
              key: item.branch,
              label: item.branch,
              value: item.achievement,
            }))}
          />
        ) : (
          <EmptyState
            icon="building"
            title="No branch sales"
            description={`No branch has sales for ${formatMonth(summary.period)}.`}
          />
        )
      ) : (
        <>
          <TotalCard summary={summary} />
          {dailyTotals.length > 0 ? (
            <ReportCard title="Daily sales" note="Touch the chart to read a day." tone="accent">
              <AreaChart
                data={dailyTotals}
                target={dailyTarget || undefined}
                label="Daily sales"
                tone="accent"
              />
            </ReportCard>
          ) : null}
          <GroupFilter groups={summary.groups} value={filters} onChange={setFilters} />
          <TileGrid
            items={groups}
            keyOf={(group) => group.group}
            render={(group) => <GroupCard group={group} />}
          />
          {groups.length === 0 ? (
            <EmptyState
              icon="chart"
              title="No groups match"
              description="Try another status or group.">
              <Button variant="soft" onPress={() => setFilters(NO_GROUP_FILTERS)}>
                Clear filters
              </Button>
            </EmptyState>
          ) : null}
        </>
      )}
    </>
  );
}

export function LaporanPenjualanScreen() {
  const { bottom } = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<string>(VIEWS[0].value);
  const period = useLaporanPenjualanPeriod((state) => state.period);
  const online = useIsOnline();
  const exportReport = useExportReport();
  const { refresh, isRefreshing } = useRefreshReport();
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, isPlaceholderData, refetch } =
    useReportSummary(period);
  // Read on every render, and opening the Actions sheet renders, so it is current when it shows.
  const canUpdate = canRefresh(dataUpdatedAt);

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
      <Stack.Screen
        options={{
          // The export menu lives in the top bar; it has nothing to export until a report loads.
          headerRight: data
            ? () => (
                <IconButton
                  size="sm"
                  icon="more"
                  label="Actions"
                  disabled={exportReport.isPending}
                  onPress={() => setMenuOpen(true)}
                />
              )
            : undefined,
        }}
      />
      <Sheet visible={menuOpen} title="Actions" onClose={() => setMenuOpen(false)}>
        <ListGroup>
          {/* The report only changes once a morning, so this is how to ask for it sooner, and
              only once an hour: the row says when it can be used again. */}
          <ListRow
            label="Update data"
            icon="refresh"
            value={
              canUpdate
                ? `Updated ${formatSyncedAt(dataUpdatedAt)}`
                : `Available at ${formatSyncedAt(nextRefreshAt(dataUpdatedAt))}`
            }
            disabled={!online || isRefreshing || !canUpdate}
            onPress={() => {
              setMenuOpen(false);
              void refresh();
            }}
          />
          <FullAmountsRow />
          {exportActions.map((action) => (
            <ListRow
              key={action.format}
              label={action.label}
              icon={action.icon}
              onPress={() => {
                setMenuOpen(false);
                download(action.format);
              }}
            />
          ))}
        </ListGroup>
      </Sheet>
      <View className="pb-4 pt-2">
        <PeriodChips currentPeriod={data?.period} />
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
        // No pull to refresh on this screen: "Update data" in the Actions menu is the one way, and it
        // is limited to once an hour, so a pull must not be a way around that.
        <ScrollView
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{
            // Room for the floating switch, so it never covers the last card.
            paddingBottom: bottom + sizes.screenTopGap * 2 + sizes.touch,
            flexGrow: 1,
          }}>
          {isPlaceholderData ? (
            <Loading label="Loading period" />
          ) : isRefetching ? (
            <Loading label="Updating data" />
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
            <Report summary={data} view={view} />
          ) : (
            <EmptyState
              icon="chart"
              title="No sales yet"
              description={`Nothing has been recorded for ${formatMonth(data.period)}.`}
            />
          )}
        </ScrollView>
      )}
      {/* Floats over the report, within reach of the thumb. */}
      <View
        className="absolute left-5 right-5 rounded-pill bg-surface shadow-card"
        style={{ bottom: bottom + sizes.screenTopGap }}>
        <SegmentedControl
          label="Break down by"
          fullWidth
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      </View>
    </Screen>
  );
}
