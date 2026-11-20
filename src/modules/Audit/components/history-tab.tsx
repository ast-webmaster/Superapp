import { View } from 'react-native';

import { AppText, Badge, EmptyState } from '@/shared/ui';
import { formatDateTime, sentenceCase } from '@/shared/utils/format';

import { useAuditApprovals } from '../hooks/use-audit-parts';
import { divider, PartGate, Section } from './detail-parts';
import { logBadge } from './status';

/** The approval log, newest first. The server sends it oldest first. */
export function HistoryTab({ uuid }: { uuid: string }) {
  const query = useAuditApprovals(uuid);

  return (
    <PartGate query={query} label="Loading history">
      {(log) =>
        log.length === 0 ? (
          <EmptyState icon="history" title="No history" description="Nothing has happened yet." />
        ) : (
          <Section title="Approval history">
            {[...log].reverse().map((entry, index) => (
              <View key={entry.id} className="gap-2">
                {index > 0 ? divider : null}
                <View className="flex-row items-center justify-between gap-3">
                  <Badge size="sm" {...logBadge(entry.status)} />
                  {entry.action_at ? (
                    <AppText variant="label" tone="muted">
                      {formatDateTime(entry.action_at)}
                    </AppText>
                  ) : null}
                </View>
                <AppText variant="caption">
                  {[entry.user_name ?? entry.user, sentenceCase(entry.tier)].join(' · ')}
                </AppText>
                {entry.remarks ? <AppText variant="label">{entry.remarks}</AppText> : null}
              </View>
            ))}
          </Section>
        )
      }
    </PartGate>
  );
}
