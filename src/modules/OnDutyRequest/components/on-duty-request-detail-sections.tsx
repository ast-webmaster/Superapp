import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

import type { OnDutyRequestFile } from '../hooks/use-on-duty-request-file';
import type { OnDutyCost, OnDutyDestination, OnDutyRequestDetail, OnDutyStep } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge, stepBadge, tripTypeLabel } from './status';

const divider = <View role="separator" className="h-px bg-border" />;

type Download = {
  onDownload: (file: OnDutyRequestFile) => void;
  /** The file being fetched, to show its row as busy. */
  pending: OnDutyRequestFile | undefined;
};

const isPending = (download: Download, file: OnDutyRequestFile) =>
  download.pending?.kind === file.kind && download.pending.id === file.id;

/** One card of the detail screen. The screen spaces the cards with `gap-4`. */
function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
      {title ? (
        <AppText variant="caption-strong" role="heading">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

/** One label and value on a line, the value right-aligned. `strong` is the total line. */
function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <AppText
        variant={strong ? 'caption-strong' : 'caption'}
        className="min-w-0 flex-1 text-right">
        {value}
      </AppText>
    </View>
  );
}

/** A file the user can fetch: its name and a download icon, or a spinner while it loads. */
function FileRow({
  name,
  caption,
  busy,
  onPress,
}: {
  name: string;
  caption?: string | null;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      aria-label={`Download ${name}`}
      disabled={busy}
      onPress={onPress}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-sm bg-surface-gray px-3 py-2 active:bg-border',
        focusRing,
      )}>
      <Icon name="doc" color="primary" />
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={1}>
          {name}
        </AppText>
        {caption ? (
          <AppText variant="label" tone="muted" numberOfLines={2}>
            {caption}
          </AppText>
        ) : null}
      </View>
      {busy ? (
        <ActivityIndicator accessibilityLabel={`Downloading ${name}`} color={colors.primary} />
      ) : (
        <Icon name="download" color="ink-muted" />
      )}
    </Pressable>
  );
}

export function SummarySection({ detail }: { detail: OnDutyRequestDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.purpose ?? detail.on_duty_no}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.requester_name ?? detail.requester} />
          <Badge size="sm" {...statusBadge(detail.status)} />
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.on_duty_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: OnDutyRequestDetail }) {
  const brands = detail.brands
    .map((brand) => brand.category_name ?? brand.category_code)
    .join(', ');
  const rows: [string, string | null][] = [
    ['Type', tripTypeLabel(detail.type)],
    ['Brands', brands],
    ['Remarks', detail.remarks],
    ['Last updated by', detail.last_updated_name],
  ];
  const declared = detail.grand_total_real !== null;

  return (
    <Section title="Detail">
      <DetailRow label="Request no" value={detail.on_duty_no} />
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {detail.sharing.length > 0 ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Cost sharing
          </AppText>
          {detail.sharing.map((row) => (
            <AppText key={row.category_code} variant="caption">
              {`${row.category_name ?? row.category_code}: ${row.percentage}%`}
            </AppText>
          ))}
        </View>
      ) : null}
      {divider}
      <DetailRow label="Costs" value={formatMoney(detail.total)} />
      <DetailRow label="Allowance" value={formatMoney(detail.total_allowance)} />
      <DetailRow strong label="Grand total" value={formatMoney(detail.grand_total)} />
      {declared ? (
        <>
          {divider}
          <DetailRow label="Actual costs" value={formatMoney(detail.total_real ?? 0)} />
          <DetailRow
            label="Actual allowance"
            value={formatMoney(detail.total_allowance_real ?? 0)}
          />
          <DetailRow
            strong
            label="Actual total"
            value={formatMoney(detail.grand_total_real ?? 0)}
          />
        </>
      ) : null}
    </Section>
  );
}

function DestinationBlock({ row }: { row: OnDutyDestination }) {
  return (
    <View className="gap-1 rounded-sm border border-border p-3">
      <AppText variant="caption-strong">{row.destination ?? '-'}</AppText>
      <AppText variant="caption">
        {`${formatDate(row.start_date)} - ${formatDate(row.end_date)} · ${row.days} ${row.days === 1 ? 'day' : 'days'}`}
      </AppText>
      {row.employee_name ? (
        <AppText variant="label" tone="muted">
          {row.employee_name}
        </AppText>
      ) : null}
      <AppText variant="label" tone="muted">
        {row.allowance_per_day === null
          ? 'No allowance'
          : `Allowance ${formatMoney(row.allowance_per_day)} a day, ${formatMoney(row.total_allowance)} in total`}
      </AppText>
    </View>
  );
}

export function DestinationsSection({ detail }: { detail: OnDutyRequestDetail }) {
  if (detail.destinations.length === 0) return null;

  return (
    <Section title={`Destinations (${detail.destinations.length})`}>
      {detail.destinations.map((row) => (
        <DestinationBlock key={row.uuid} row={row} />
      ))}
    </Section>
  );
}

const needPrLabels: Record<string, string> = {
  PR: 'Purchase request',
  'NO-PR': 'Paid on realization',
  VOUCHER: 'Voucher',
};

function CostBlock({ cost, download }: { cost: OnDutyCost; download: Download }) {
  const receipt: OnDutyRequestFile = {
    kind: 'receipt',
    id: cost.id,
    name: `Receipt ${cost.item_description ?? cost.item_code}`,
  };

  return (
    <View className="gap-2 rounded-sm border border-border p-3">
      <AppText variant="caption-strong">{cost.item_description ?? cost.item_code}</AppText>
      <View className="flex-row flex-wrap items-center gap-2">
        {cost.need_pr ? (
          <Badge size="sm" label={needPrLabels[cost.need_pr] ?? cost.need_pr} />
        ) : null}
        {cost.sharing_costs === 'YES' ? <Badge size="sm" tone="info" label="Shared" /> : null}
        {cost.pr_no ? <Badge size="sm" tone="info" label={cost.pr_no} /> : null}
      </View>
      <DetailRow label="Estimate" value={formatMoney(cost.amount)} />
      {cost.remarks ? (
        <AppText variant="label" tone="muted">
          {`Remarks: ${cost.remarks}`}
        </AppText>
      ) : null}
      {cost.amount_real !== null ? (
        <>
          <DetailRow strong label="Actual" value={formatMoney(cost.amount_real)} />
          {cost.remarks_real ? (
            <AppText variant="label" tone="muted">
              {`Actual remarks: ${cost.remarks_real}`}
            </AppText>
          ) : null}
        </>
      ) : null}
      {cost.receipt_url ? (
        <FileRow
          name={receipt.name}
          caption="Receipt"
          busy={isPending(download, receipt)}
          onPress={() => download.onDownload(receipt)}
        />
      ) : null}
    </View>
  );
}

export function CostsSection({ detail, ...download }: { detail: OnDutyRequestDetail } & Download) {
  if (detail.costs.length === 0) return null;

  return (
    <Section title={`Costs (${detail.costs.length})`}>
      {detail.costs.map((cost) => (
        <CostBlock key={cost.id} cost={cost} download={download} />
      ))}
    </Section>
  );
}

/** The letter of assignment, then the other files of the request. */
export function FilesSection({ detail, ...download }: { detail: OnDutyRequestDetail } & Download) {
  const letter: OnDutyRequestFile = { kind: 'letter', id: 0, name: 'Letter of assignment' };
  if (!detail.letter_of_assignment_url && detail.attachments.length === 0) return null;

  return (
    <Section title="Files">
      {detail.letter_of_assignment_url ? (
        <FileRow
          name={letter.name}
          busy={isPending(download, letter)}
          onPress={() => download.onDownload(letter)}
        />
      ) : null}
      {detail.attachments.map((attachment) => {
        const file: OnDutyRequestFile = {
          kind: 'attachment',
          id: attachment.id,
          name: attachment.file,
        };
        return (
          <FileRow
            key={attachment.id}
            name={attachment.file}
            caption={attachment.description}
            busy={isPending(download, file)}
            onPress={() => download.onDownload(file)}
          />
        );
      })}
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

function stepState(step: OnDutyStep): StepState {
  if (step.status === 'REJECTED') return 'rejected';
  if (step.action_at) return 'done';
  return step.status === 'AWAITING' ? 'current' : 'upcoming';
}

/** The 20px column left of a step: the state marker and the line down to the next step. */
function StepMarker({ state, last }: { state: StepState; last: boolean }) {
  return (
    <View className="w-5 items-center">
      <View className="h-5 items-center justify-center">
        {state === 'done' ? <Icon name="check" size={18} color="success" /> : null}
        {state === 'rejected' ? <Icon name="x" size={18} color="danger" /> : null}
        {state === 'current' ? <View className="size-3 rounded-pill bg-primary" /> : null}
        {state === 'upcoming' ? (
          <View className="size-3 rounded-pill border border-ink-muted bg-surface" />
        ) : null}
      </View>
      {last ? null : <View className="mt-1 w-px flex-1 bg-border" />}
    </View>
  );
}

/** Newest step first: the chain comes oldest first, so the list is shown reversed. */
export function HistorySection({ title, steps }: { title: string; steps: OnDutyStep[] }) {
  if (steps.length === 0) return null;

  const newestFirst = [...steps].reverse();

  return (
    <Section title={title}>
      <View>
        {newestFirst.map((step, index) => {
          const state = stepState(step);
          const last = index === newestFirst.length - 1;

          return (
            <View key={`${step.tier}-${index}`} className="flex-row gap-3">
              <StepMarker state={state} last={last} />
              <View className={clsx('min-w-0 flex-1 gap-1', !last && 'pb-5')}>
                {step.action_at ? (
                  <AppText variant="caption" tone={state === 'rejected' ? 'danger' : 'success'}>
                    {formatDateTime(step.action_at)}
                  </AppText>
                ) : null}
                <AppText variant="label" tone="muted">
                  {step.tier}
                </AppText>
                <View className="flex-row items-center gap-2">
                  {step.user_name ? (
                    <AppText variant="caption" tone="muted" className="min-w-0 shrink">
                      {step.user_name}
                    </AppText>
                  ) : null}
                  <Badge size="sm" {...stepBadge(step.status)} />
                </View>
                {step.remarks ? <AppText variant="label">{step.remarks}</AppText> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

/** The declaration (real costs after the trip): its number, status, note and approval chain. */
export function DeclarationSection({ detail }: { detail: OnDutyRequestDetail }) {
  const { declaration } = detail;
  if (!declaration) return null;

  return (
    <>
      <Section title="Declaration">
        {declaration.declaration_no ? (
          <DetailRow label="Declaration no" value={declaration.declaration_no} />
        ) : null}
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="label" tone="muted">
            Status
          </AppText>
          <Badge size="sm" {...statusBadge(declaration.status)} />
        </View>
        {declaration.remarks ? <DetailRow label="Notes" value={declaration.remarks} /> : null}
      </Section>
      <HistorySection title="Declaration history" steps={declaration.approvements} />
    </>
  );
}
