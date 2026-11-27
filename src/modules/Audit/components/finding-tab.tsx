import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Badge, Button, EmptyState } from '@/shared/ui';
import { formatDate, formatDateTime, sentenceCase } from '@/shared/utils/format';

import { useAuditFile } from '../hooks/use-audit-file';
import { useAuditFindings } from '../hooks/use-audit-parts';
import type { AuditFinding } from '../types';
import { AttachmentRow } from './attachment-row';
import { DetailRow, divider, PartGate } from './detail-parts';
import { EvidenceSheet } from './evidence-sheet';
import { FindingResponseSheet } from './finding-response-sheet';
import { categoryBadge } from './status';

type FindingCardProps = {
  uuid: string;
  finding: AuditFinding;
  online: boolean;
  onRespond: () => void;
  onAddEvidence: () => void;
};

function FindingCard({ uuid, finding, online, onRespond, onAddEvidence }: FindingCardProps) {
  const { download, pending } = useAuditFile(uuid);
  const rows: [string, string | null][] = [
    ['PIC', finding.pic_name ?? finding.pic],
    ['Root cause', finding.root_cause],
    ['Impact', finding.impact],
    ['Recommendation', finding.recommendation],
  ];

  return (
    <View className="gap-3 rounded-xl bg-surface p-4 shadow-card">
      <View className="gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" {...categoryBadge(finding.category)} />
          <Badge size="sm" label={sentenceCase(finding.status)} />
          <Badge
            size="sm"
            tone={finding.is_answered ? 'success' : 'warning'}
            icon={finding.is_answered ? 'check' : undefined}
            label={finding.is_answered ? 'Answered' : 'Not answered'}
          />
        </View>
        <AppText variant="caption-strong">{finding.audit_finding}</AppText>
      </View>
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {finding.auditee_response || finding.due_date ? (
        <>
          {divider}
          {finding.auditee_response ? (
            <View className="gap-1">
              <AppText variant="label" tone="muted">
                Auditee response
              </AppText>
              <AppText variant="caption">{finding.auditee_response}</AppText>
            </View>
          ) : null}
          {finding.due_date ? (
            <DetailRow label="Due date" value={formatDate(finding.due_date)} />
          ) : null}
          {finding.response_updated_at ? (
            <AppText variant="label" tone="muted">
              {`Updated ${formatDateTime(finding.response_updated_at)}${
                finding.response_updated_by_name ? ` by ${finding.response_updated_by_name}` : ''
              }`}
            </AppText>
          ) : null}
        </>
      ) : null}
      {finding.attachments.length > 0 ? (
        <>
          {divider}
          <AppText variant="label" tone="muted">
            Evidence
          </AppText>
          {finding.attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              busy={pending?.kind === 'finding' && pending.id === attachment.id}
              disabled={!online || pending !== undefined}
              onPress={() =>
                download({
                  kind: 'finding',
                  findingId: finding.id,
                  id: attachment.id,
                  name: attachment.file,
                })
              }
            />
          ))}
        </>
      ) : null}
      {finding.can_respond ? (
        <View className="flex-row gap-2">
          <Button
            size="sm"
            variant="soft"
            iconLeft="pencil"
            className="flex-1"
            disabled={!online}
            onPress={onRespond}>
            {finding.is_answered ? 'Edit response' : 'Respond'}
          </Button>
          <Button
            size="sm"
            variant="soft"
            iconLeft="upload"
            className="flex-1"
            disabled={!online}
            onPress={onAddEvidence}>
            Add evidence
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The findings the user may see. A PIC sees only their own; the Responsibility sees all. Where the
 * server says `can_respond`, the user answers a finding and attaches evidence while the card is
 * awaiting follow up. Adding and editing findings stays on the web.
 */
export function FindingTab({ uuid, online }: { uuid: string; online: boolean }) {
  const query = useAuditFindings(uuid);
  const [target, setTarget] = useState<AuditFinding | null>(null);
  const [sheet, setSheet] = useState<'response' | 'evidence' | null>(null);

  const open = (finding: AuditFinding, next: 'response' | 'evidence') => {
    setTarget(finding);
    setSheet(next);
  };

  return (
    <>
      <PartGate query={query} label="Loading findings">
        {({ items }) =>
          items.length === 0 ? (
            <EmptyState
              icon="list"
              title="No findings"
              description="There is no finding you can see on this audit."
            />
          ) : (
            items.map((finding) => (
              <FindingCard
                key={finding.id}
                uuid={uuid}
                finding={finding}
                online={online}
                onRespond={() => open(finding, 'response')}
                onAddEvidence={() => open(finding, 'evidence')}
              />
            ))
          )
        }
      </PartGate>
      <FindingResponseSheet
        uuid={uuid}
        finding={target}
        visible={sheet === 'response'}
        onClose={() => setSheet(null)}
        online={online}
      />
      <EvidenceSheet
        uuid={uuid}
        finding={target}
        visible={sheet === 'evidence'}
        onClose={() => setSheet(null)}
        online={online}
      />
    </>
  );
}
