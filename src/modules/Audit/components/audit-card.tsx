import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { auditRoutes } from '../navigation/routes';
import type { AuditListItem } from '../types';
import { ProgressTrack } from './progress-track';
import { statusBadge } from './status';

/** "16 Nov 2026 - 20 Nov 2026", or the one day when the activity starts and ends together. */
export function formatPeriod(start: string | null, end: string | null) {
  if (!start) return null;
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function AuditCard({ item }: { item: AuditListItem }) {
  const period = formatPeriod(item.period_activity_start, item.period_activity_end);
  const place = [item.branch_name, item.department].filter(Boolean).join(' · ');

  return (
    <MorphLink href={auditRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.audit_no}`}
        className={clsx(
          'gap-4 rounded-xl bg-surface p-4 shadow-card active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.audit_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.title}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? (
              <Badge size="sm" tone="warning" icon="bell" label="Waiting for you" />
            ) : null}
          </View>
        </View>
        {item.progress && item.progress.total > 0 ? (
          <ProgressTrack label="Programs settled" percent={item.progress.percent} />
        ) : null}
        <View role="separator" className="h-px bg-border" />
        <View className="gap-1">
          {place ? (
            <AppText variant="caption" numberOfLines={1}>
              {place}
            </AppText>
          ) : null}
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {[period, item.team_leader_name].filter(Boolean).join(' · ')}
          </AppText>
        </View>
      </Pressable>
    </MorphLink>
  );
}
