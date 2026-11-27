import { View } from 'react-native';

import { Alert, AppText, Badge, EmptyState } from '@/shared/ui';
import { formatCompactMoney, formatDate, formatMoney, formatMonth } from '@/shared/utils/format';

import type { Achievement, AchievementGroup } from '../types';
import { formatPercent, formatSignedPercent } from './number';
import { SectionTitle, Stat } from './section-title';
import { ShareBar } from './share-bar';
import { achievementBadge } from './status';

interface Figures {
  target: number;
  achievement: number;
  achievement_percentage: number | null;
  linearity_percentage: number;
  gap_percentage: number | null;
  status: string;
}

function FiguresBlock({ figures }: { figures: Figures }) {
  return (
    <>
      <View className="flex-row gap-3">
        <Stat label="Achievement" value={formatCompactMoney(figures.achievement)} />
        <Stat label="Target" value={formatCompactMoney(figures.target)} />
      </View>
      <ShareBar
        percentage={figures.achievement_percentage ?? 0}
        marker={figures.target > 0 ? figures.linearity_percentage : undefined}
      />
      <View className="flex-row gap-3">
        <Stat label="Of target" value={formatPercent(figures.achievement_percentage)} />
        <Stat label="Linearity" value={formatPercent(figures.linearity_percentage)} />
        <Stat label="Gap" value={formatSignedPercent(figures.gap_percentage)} />
      </View>
    </>
  );
}

function GroupCard({ group }: { group: AchievementGroup }) {
  return (
    <View
      accessible
      aria-label={`${group.group_name}, ${achievementBadge(group.status).label}, ${formatMoney(group.achievement)} of ${formatMoney(group.target)}`}
      className="gap-3 rounded-xl shadow-card bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="caption-strong" numberOfLines={2} className="min-w-0 shrink">
          {group.group_name}
        </AppText>
        <Badge size="sm" {...achievementBadge(group.status)} />
      </View>
      <FiguresBlock figures={group} />
    </View>
  );
}

/** Sales this month against target, with where the month's linearity says it should be. */
export function TargetView({ data }: { data: Achievement }) {
  const { summary, groups, acuan, meta } = data;

  return (
    <>
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 shrink gap-1">
            <AppText variant="module-title" role="heading">
              {formatMonth(acuan.periode)}
            </AppText>
            <AppText variant="caption" tone="muted">
              {`Sales up to ${formatDate(acuan.tanggal)}. The tick marks where the month should be.`}
            </AppText>
          </View>
          <Badge size="sm" {...achievementBadge(summary.status)} />
        </View>
        <FiguresBlock figures={summary} />
      </View>
      {!meta.has_target ? (
        <Alert
          tone="info"
          message={`No target has been uploaded for ${formatMonth(acuan.periode)} yet.`}
        />
      ) : null}
      <SectionTitle title="Groups" />
      {groups.map((group) => (
        <GroupCard key={group.group_id} group={group} />
      ))}
      {groups.length === 0 ? (
        <EmptyState
          icon="chart"
          title="No groups yet"
          description={`Nothing has been recorded for ${formatMonth(acuan.periode)}.`}
        />
      ) : null}
    </>
  );
}
