import { useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Stack } from 'expo-router/stack';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors, sizes } from '@/shared/theme/tokens';
import { Alert, AppText, Badge, Button, EmptyState, ListGroup, ListRow, Screen } from '@/shared/ui';
import { formatMoney, formatSyncedAt } from '@/shared/utils/format';

import { BranchCard } from '../components/branch-card';
import { AreaChart } from '../components/charts/area-chart';
import { ColumnChart } from '../components/charts/column-chart';
import { Meter } from '../components/charts/meter';
import { currentPeriod, expectedShare, formatPercent, levelBadge } from '../components/level';
import { GroupSkeleton } from '../components/report-skeletons';
import { useReportGroup } from '../hooks/use-report-group';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';
import type { GroupDetail } from '../types';

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-1">
        <AppText variant="module-title" role="heading">
          {title}
        </AppText>
        {note ? (
          <AppText variant="caption" tone="muted">
            {note}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SummaryCard({ detail }: { detail: GroupDetail }) {
  const { achievement, target } = detail;
  const expected = expectedShare(
    detail.period,
    detail.dates.length,
    target.day_left,
    currentPeriod(),
  );

  return (
    <>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 shrink gap-1">
            <AppText variant="label" tone="muted">
              {detail.label}
            </AppText>
            <AppText variant="heading">{formatMoney(achievement.value)}</AppText>
          </View>
          <Badge size="sm" {...levelBadge(achievement.level)} />
        </View>
        <Meter percentage={achievement.percentage} expected={expected} />
        <View className="flex-row justify-between gap-3">
          <AppText variant="caption" tone="muted">
            {expected !== null
              ? `Expected by now ${formatPercent(expected)}`
              : `Target ${formatMoney(target.monthly_amount)}`}
          </AppText>
          <AppText variant="caption-strong">{`${formatPercent(achievement.percentage)} of target`}</AppText>
        </View>
      </View>
      {/* A ListGroup is a card of its own, so it sits beside the summary, not inside it. */}
      <ListGroup>
        <ListRow label="Monthly target" value={formatMoney(target.monthly_amount)} />
        <ListRow label="Daily target" value={formatMoney(target.daily_amount)} />
        <ListRow
          label={target.balance < 0 ? 'Still to sell' : 'Above target'}
          value={formatMoney(Math.abs(target.balance))}
        />
        <ListRow label="Working days left" value={String(Math.max(target.day_left, 0))} />
        {target.balance < 0 && target.day_left > 0 ? (
          <ListRow label="Needed per day" value={formatMoney(-target.balance_daily)} />
        ) : null}
      </ListGroup>
    </>
  );
}

function GroupReport({ detail }: { detail: GroupDetail }) {
  // The latest week with sales is the strong column; the others stay soft.
  const currentWeek = [...detail.weekly].reverse().find((week) => week.value > 0)?.week;

  return (
    <>
      <SummaryCard detail={detail} />
      {detail.daily_totals.length > 0 ? (
        <Card title="Daily sales" note="Touch the chart to read a day.">
          <AreaChart
            data={detail.daily_totals}
            target={detail.target.daily_amount || undefined}
            label="Daily sales"
          />
        </Card>
      ) : null}
      {detail.weekly.length > 0 ? (
        <Card title="Sales per week" note="With each week's share of the monthly target.">
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
        </Card>
      ) : null}
      {detail.branches.length > 0 ? (
        <>
          <AppText variant="title" role="heading" className="pt-2">
            Branches
          </AppText>
          {detail.branches.map((branch) => (
            <BranchCard key={branch.branch} branch={branch} />
          ))}
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
      <Stack.Screen options={{ title: data?.group ?? group }} />
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
