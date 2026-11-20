import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { useAuditChecklists, useAuditAttachments } from '../hooks/use-audit-parts';
import { useAuditFile } from '../hooks/use-audit-file';
import type { AuditDetail } from '../types';
import { AttachmentRow } from './attachment-row';
import { formatPeriod } from './audit-card';
import { DetailRow, divider, PartGate, Section } from './detail-parts';

function InfoSection({ detail }: { detail: AuditDetail }) {
  const rows: [string, string | null][] = [
    ['Branch', detail.branch_name],
    ['Department', detail.department],
    ['Type', detail.audit_type.join(', ') || null],
    ['Data period', formatPeriod(detail.period_start, detail.period_end)],
    ['Activity', formatPeriod(detail.period_activity_start, detail.period_activity_end)],
    ['Team leader', detail.team_leader_name ?? detail.team_leader],
    ['Responsibility', detail.responsibility_name ?? detail.responsibility],
    ['Audit date', detail.audit_date ? formatDate(detail.audit_date) : null],
    ['Remarks', detail.remarks],
  ];

  return (
    <Section title="Detail">
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {divider}
      <DetailRow
        label="Findings answered"
        value={`${detail.finding_stats.answered} of ${detail.finding_stats.total}`}
      />
      {detail.finding_stats.without_pic > 0 ? (
        <DetailRow label="Findings without PIC" value={String(detail.finding_stats.without_pic)} />
      ) : null}
    </Section>
  );
}

function ChecklistSection({ uuid }: { uuid: string }) {
  const query = useAuditChecklists(uuid);

  return (
    <PartGate query={query} label="Loading checklist">
      {({ items, meta }) =>
        items.length === 0 ? null : (
          <Section
            title="Checklist"
            trailing={<Badge size="sm" label={`${meta.completed} of ${meta.total}`} />}>
            {items.map((item) => (
              <View key={item.id} className="gap-1">
                <View className="flex-row items-start gap-2">
                  <Badge
                    size="sm"
                    tone={item.is_completed ? 'success' : item.is_overdue ? 'danger' : 'neutral'}
                    icon={item.is_completed ? 'check' : undefined}
                    label={item.is_completed ? 'Done' : item.is_overdue ? 'Overdue' : 'Open'}
                  />
                  <AppText variant="caption" className="min-w-0 flex-1">
                    {item.description}
                  </AppText>
                </View>
                {item.due_date ? (
                  <AppText variant="label" tone="muted" className="pl-1">
                    {item.is_completed && item.finished_at
                      ? `Finished ${formatDate(item.finished_at)}`
                      : `Due ${formatDate(item.due_date)}`}
                  </AppText>
                ) : null}
              </View>
            ))}
          </Section>
        )
      }
    </PartGate>
  );
}

function AttachmentSection({ uuid, online }: { uuid: string; online: boolean }) {
  const query = useAuditAttachments(uuid);
  const { download, pending } = useAuditFile(uuid);

  return (
    <PartGate query={query} label="Loading attachments">
      {(attachments) =>
        attachments.length === 0 ? null : (
          <Section title="Attachments">
            {attachments.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                busy={pending?.kind === 'card' && pending.id === attachment.id}
                disabled={!online || pending !== undefined}
                onPress={() => download({ kind: 'card', id: attachment.id, name: attachment.file })}
              />
            ))}
          </Section>
        )
      }
    </PartGate>
  );
}

export function OverviewTab({ detail, online }: { detail: AuditDetail; online: boolean }) {
  return (
    <>
      <InfoSection detail={detail} />
      <ChecklistSection uuid={detail.uuid} />
      <AttachmentSection uuid={detail.uuid} online={online} />
    </>
  );
}
