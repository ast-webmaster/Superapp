import { View } from 'react-native';

import { AppText, Badge, EmptyState } from '@/shared/ui';

import { useAuditPrograms } from '../hooks/use-audit-parts';
import type { AuditProgram } from '../types';
import { formatPeriod } from './audit-card';
import { DetailRow, PartGate, Section } from './detail-parts';
import { ProgressTrack } from './progress-track';
import { programBadge } from './status';

function ProgramBlock({ program }: { program: AuditProgram }) {
  const schedule = formatPeriod(program.schedule_start, program.schedule_end);

  return (
    <View className="gap-3 rounded-xl bg-surface p-4 border border-border">
      <View className="gap-1">
        {program.div_dept ? (
          <AppText variant="label" tone="muted">
            {program.div_dept}
          </AppText>
        ) : null}
        <AppText variant="caption-strong">{program.process_description}</AppText>
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" {...programBadge(program.status)} />
          {schedule ? (
            <AppText variant="label" tone="muted">
              {schedule}
            </AppText>
          ) : null}
        </View>
      </View>
      {program.audit_objective ? (
        <DetailRow label="Objective" value={program.audit_objective} />
      ) : null}
      {program.risk ? <DetailRow label="Risk" value={program.risk} /> : null}
      {program.result ? <DetailRow label="Result" value={program.result} /> : null}
    </View>
  );
}

/** The audit programs of the card, read only: planning and editing them stays on the web. */
export function ProgramTab({ uuid }: { uuid: string }) {
  const query = useAuditPrograms(uuid);

  return (
    <PartGate query={query} label="Loading programs">
      {({ items, meta }) =>
        items.length === 0 ? (
          <EmptyState
            icon="list"
            title="No programs"
            description="This audit has no program yet."
          />
        ) : (
          <>
            <Section>
              <ProgressTrack label="Programs settled" percent={meta.percent} />
              <AppText variant="label" tone="muted">
                {`${meta.done} done, ${meta.pending} pending, ${meta.new} new`}
              </AppText>
            </Section>
            {items.map((program) => (
              <ProgramBlock key={program.id} program={program} />
            ))}
          </>
        )
      }
    </PartGate>
  );
}
