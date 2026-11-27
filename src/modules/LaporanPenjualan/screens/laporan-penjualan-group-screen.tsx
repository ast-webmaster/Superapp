import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Button,
  EmptyState,
  IconButton,
  ListGroup,
  Screen,
  Sheet,
} from '@/shared/ui';
import { formatMonth, formatSyncedAt } from '@/shared/utils/format';

import { BranchCard } from '../components/branch-card';
import { BranchFilter, filterBranches, NO_BRANCH_FILTERS } from '../components/branch-filter';
import { AreaChart } from '../components/charts/area-chart';
import { ColumnChart } from '../components/charts/column-chart';
import { daysLeftBadge, HeroCard } from '../components/hero-card';
import { formatPercent, levelBadge } from '../components/level';
import { ReportCard } from '../components/report-card';
import { GroupSkeleton } from '../components/report-skeletons';
import { TileGrid } from '../components/ticker-tile';
import { FullAmountsRow } from '../components/full-amounts-row';
import { dayBars } from '../components/series';
import { useReportGroup } from '../hooks/use-report-group';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';
import type { GroupDetail } from '../types';

function SummaryCard({ detail }: { detail: GroupDetail }) {
  const { achievement, target } = detail;

  return (
    <HeroCard
      tone="primary"
      eyebrow={formatMonth(detail.period)}
      badge={daysLeftBadge(target.day_left)}
      amount={achievement.value}
      target={target.monthly_amount}
      percentage={achievement.percentage}
      level={achievement.level}
      status={levelBadge(achievement.level)}
      bars={dayBars(detail.daily_totals, target.daily_amount)}
      stats={[
        { label: 'Daily target', value: target.daily_amount },
        {
          label: target.balance < 0 ? 'Still to sell' : 'Above target',
          value: Math.abs(target.balance),
        },
        // What each remaining day must add: only while the target is not reached and days remain.
        ...(target.balance < 0 && target.day_left > 0
          ? [{ label: 'Needed per day', value: -target.balance_daily }]
          : []),
      ]}
    />
  );
}

function GroupReport({ detail }: { detail: GroupDetail }) {
  const [filters, setFilters] = useState(NO_BRANCH_FILTERS);
  // The latest week with sales is the strong column; the others stay soft.
  const currentWeek = [...detail.weekly].reverse().find((week) => week.value > 0)?.week;
  const branches = filterBranches(detail.branches, filters);

  return (
    <>
      <SummaryCard detail={detail} />
      {detail.daily_totals.length > 0 ? (
        <ReportCard title="Daily sales" note="Touch the chart to read a day." tone="accent">
          <AreaChart
            data={detail.daily_totals}
            target={detail.target.daily_amount || undefined}
            label="Daily sales"
            tone="accent"
          />
        </ReportCard>
      ) : null}
      {detail.weekly.length > 0 ? (
        <ReportCard title="Sales per week" note="With each week's share of the monthly target.">
          <ColumnChart
            label="Sales per week"
            highlight={currentWeek}
            data={detail.weekly.map((week) => ({
              key: week.week,
              label: week.week,
              value: week.value,
              note: formatPercent(week.percentage),
            }))}
          />
        </ReportCard>
      ) : null}
      {detail.branches.length > 0 ? (
        <>
          <AppText variant="title" role="heading" className="pt-2">
            Branches
          </AppText>
          <BranchFilter branches={detail.branches} value={filters} onChange={setFilters} />
          <TileGrid
            items={branches}
            keyOf={(branch) => branch.branch}
            render={(branch) => <BranchCard branch={branch} />}
          />
          {branches.length === 0 ? (
            <EmptyState
              icon="building"
              title="No branches match"
              description="Try another status or branch.">
              <Button variant="soft" onPress={() => setFilters(NO_BRANCH_FILTERS)}>
                Clear filters
              </Button>
            </EmptyState>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function LaporanPenjualanGroupScreen() {
  const { group } = useLocalSearchParams<{ group: string }>();
  const { bottom } = useSafeAreaInsets();
  const period = useLaporanPenjualanPeriod((state) => state.period);
  const online = useIsOnline();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, error, fetchStatus, dataUpdatedAt, isRefetching, refetch } = useReportGroup(
    period,
    group,
  );

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: data?.group ?? group,
          headerRight: data
            ? () => (
                <IconButton
                  size="sm"
                  icon="more"
                  label="Actions"
                  onPress={() => setMenuOpen(true)}
                />
              )
            : undefined,
        }}
      />
      <Sheet visible={menuOpen} title="Actions" onClose={() => setMenuOpen(false)}>
        <ListGroup>
          <FullAmountsRow />
        </ListGroup>
      </Sheet>
      {data === undefined ? (
        error ? (
          toAppError(error).code === 'not_found' ? (
            <EmptyState
              icon="chart"
              title="Group not found"
              description="It has no report for this period, or you no longer have access to it."
            />
          ) : (
            <EmptyState
              icon="alert"
              title="Could not load this group"
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
          <GroupSkeleton />
        )
      ) : (
        <ScrollView
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{
            paddingTop: sizes.screenTopGap,
            paddingBottom: bottom + sizes.screenTopGap,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.primary}
            />
          }>
          {!online ? (
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
          <GroupReport detail={data} />
        </ScrollView>
      )}
    </Screen>
  );
}
