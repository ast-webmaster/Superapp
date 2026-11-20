import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';

import type { AuditDetail } from '../types';
import { formatPeriod } from './audit-card';
import { Section } from './detail-parts';
import { ProgressTrack } from './progress-track';
import { statusBadge } from './status';

/** The card at the top of the detail: number, title, status and how far the programs are. */
export function AuditSummary({ detail }: { detail: AuditDetail }) {
  const period = formatPeriod(detail.period_activity_start, detail.period_activity_end);
  const place = [detail.branch_name, detail.department].filter(Boolean).join(' · ');

  return (
    <Section>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {detail.audit_no}
        </AppText>
        <View className="flex-row items-center gap-3">
          <View className="h-6 w-1 rounded-pill bg-primary" />
          <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
            {detail.title}
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" {...statusBadge(detail.status)} />
        {detail.awaiting_me ? (
          <Badge size="sm" tone="warning" icon="bell" label="Waiting for you" />
        ) : null}
      </View>
      {place ? <AppText variant="caption">{place}</AppText> : null}
      {period ? (
        <AppText variant="label" tone="muted">
          {`Activity ${period}`}
        </AppText>
      ) : null}
      {detail.program_stats.total > 0 ? (
        <ProgressTrack label="Programs settled" percent={detail.program_stats.percent} />
      ) : null}
    </Section>
  );
}
