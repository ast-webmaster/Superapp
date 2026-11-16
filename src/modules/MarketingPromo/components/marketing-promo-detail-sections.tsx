import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

import type { MarketingPromoFile } from '../hooks/use-marketing-promo-file';
import type { MarketingPromoCost, MarketingPromoDetail, MarketingPromoStep } from '../types';
import { ApplicantPill } from './applicant-pill';
import { recapBadge, statusBadge, stepBadge } from './status';

const divider = <View role="separator" className="h-px bg-border" />;

/** One card of the detail screen. The screen spaces the cards with `gap-4`. */
function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      {title ? (
        <AppText variant="caption-strong" role="heading">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

/** One label and value on a line, the value right-aligned. `strong` is a total line. */
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

const percent = (value: number | null) => (value === null ? null : `${value}%`);

/** 1500 -> "1,500": the same grouping as `formatMoney`, without the currency. */
const formatNumber = (value: number) => formatMoney(value).replace(/^(-?)Rp /, '$1');

export function SummarySection({ detail }: { detail: MarketingPromoDetail }) {
  return (
    <Section>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {detail.promo_date
            ? `${detail.promo_no} - ${formatDate(detail.promo_date)}`
            : detail.promo_no}
        </AppText>
        <View className="flex-row items-center gap-3">
          <View className="h-6 w-1 rounded-pill bg-primary" />
          <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
            {detail.promo_name}
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        {detail.requester_name ? <ApplicantPill name={detail.requester_name} /> : null}
        <Badge size="sm" {...statusBadge(detail.status)} />
        {detail.recap_status ? <Badge size="sm" {...recapBadge(detail.recap_status)} /> : null}
      </View>
      {detail.brands.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {detail.brands.map((brand, index) => (
            <Badge
              key={brand.mkt_code ?? index}
              size="sm"
              label={brand.name ?? brand.mkt_code ?? '-'}
            />
          ))}
        </View>
      ) : null}
    </Section>
  );
}

export function InfoSection({ detail }: { detail: MarketingPromoDetail }) {
  const period =
    detail.start_of_promo_period && detail.end_of_promo_period
      ? `${formatDate(detail.start_of_promo_period)} - ${formatDate(detail.end_of_promo_period)}`
      : null;
  const rows: [string, string | null][] = [
    [
      'Type',
      [detail.category_name ?? detail.category, detail.promo_type_name ?? detail.promo_type]
        .filter(Boolean)
        .join(' - ') || null,
    ],
    ['Customer', detail.customer_name],
    ['Offices', detail.offices.join(', ') || null],
    ['Period', period],
    ['Gift', detail.gift],
    ['Reason for late submission', detail.reason_late],
    ['Late submission remarks', detail.reason_late_remarks],
  ];

  return (
    <Section title="Detail">
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {detail.promo_note ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Note
          </AppText>
          <AppText variant="caption">{detail.promo_note}</AppText>
        </View>
      ) : null}
      {detail.recap_note ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Recap note
          </AppText>
          <AppText variant="caption">{detail.recap_note}</AppText>
        </View>
      ) : null}
    </Section>
  );
}

/** Estimate against realization. Shown only when the promo has a target. */
export function TargetSection({ detail }: { detail: MarketingPromoDetail }) {
  if (detail.target === null && detail.target_realization === null) return null;

  return (
    <Section title="Target">
      <DetailRow
        label="Estimate"
        value={detail.target === null ? '-' : formatNumber(detail.target)}
      />
      {detail.target_realization !== null ? (
        <DetailRow label="Realization" value={formatNumber(detail.target_realization)} />
      ) : null}
    </Section>
  );
}

/** Who pays what share. Shown only when the promo has a split. */
export function SupportShareSection({ detail }: { detail: MarketingPromoDetail }) {
  const rows: [string, string | null][] = [
    ['Principle support', percent(detail.principle_support)],
    ['Principle park fund', percent(detail.principle_parkfund)],
    ['Astrindo support', percent(detail.astrindo_support)],
  ];
  const shown = rows.filter((row): row is [string, string] => row[1] !== null);
  if (shown.length === 0 && !detail.note_support) return null;

  return (
    <Section title="Cost sharing">
      {shown.map(([label, value]) => (
        <DetailRow key={label} label={label} value={value} />
      ))}
      {detail.note_support ? (
        <AppText variant="caption" tone="muted">
          {detail.note_support}
        </AppText>
      ) : null}
    </Section>
  );
}

function CostBlock({ line }: { line: MarketingPromoCost }) {
  const realized = line.total_realization !== null;

  return (
    <View className="gap-1">
      <AppText variant="caption-strong">{line.promo_support}</AppText>
      {line.covered_by ? <Badge size="sm" label={line.covered_by} /> : null}
      {line.total !== null ? (
        <AppText variant="caption">
          {`${line.qty ?? 0} x ${formatMoney(line.unit_price ?? 0)} = ${formatMoney(line.total)}`}
        </AppText>
      ) : null}
      {line.remarks ? (
        <AppText variant="label" tone="muted">
          {line.remarks}
        </AppText>
      ) : null}
      {realized ? (
        <AppText variant="caption" tone="success">
          {`Realized ${line.qty_realization ?? 0} x ${formatMoney(line.unit_price_realization ?? 0)} = ${formatMoney(line.total_realization ?? 0)}`}
        </AppText>
      ) : null}
      {line.remarks_realization ? (
        <AppText variant="label" tone="muted">
          {line.remarks_realization}
        </AppText>
      ) : null}
    </View>
  );
}

/** A money figure that is shown only when it is set and not zero. */
const hasAmount = (value: number | null): value is number => value !== null && value !== 0;

export function CostsSection({ detail }: { detail: MarketingPromoDetail }) {
  return (
    <Section title={`Costs (${detail.costs.length})`}>
      {detail.costs.map((line) => (
        <View key={line.id} className="rounded-lg border border-border p-3">
          <CostBlock line={line} />
        </View>
      ))}
      {divider}
      <DetailRow
        strong
        label="Estimated total"
        value={
          detail.estimated_total_cost === null ? '-' : formatMoney(detail.estimated_total_cost)
        }
      />
      {hasAmount(detail.real_total_cost) ? (
        <DetailRow label="Real total" value={formatMoney(detail.real_total_cost)} />
      ) : null}
      {hasAmount(detail.additional_total_cost) ? (
        <DetailRow label="Additional cost" value={formatMoney(detail.additional_total_cost)} />
      ) : null}
      {detail.ratio_cost ? <DetailRow label="Cost ratio" value={`${detail.ratio_cost}%`} /> : null}
      {detail.ratio_cost_realization ? (
        <DetailRow label="Realized cost ratio" value={`${detail.ratio_cost_realization}%`} />
      ) : null}
    </Section>
  );
}

function FileRow({
  name,
  description,
  busy,
  onPress,
}: {
  name: string;
  description?: string | null;
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
        'min-h-control flex-row items-center gap-3 rounded-lg bg-surface-gray px-3 py-2 active:bg-border',
        focusRing,
      )}>
      <Icon name="doc" color="primary" />
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={1}>
          {name}
        </AppText>
        {description ? (
          <AppText variant="label" tone="muted" numberOfLines={2}>
            {description}
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

/**
 * The mechanism document and the attachments, each a row the user taps to download: a download
 * icon, or a spinner while it loads.
 */
export function FilesSection({
  detail,
  onDownload,
  pending,
}: {
  detail: MarketingPromoDetail;
  onDownload: (file: MarketingPromoFile) => void;
  /** The file being fetched, to show its row as busy. */
  pending: MarketingPromoFile | undefined;
}) {
  if (!detail.mechanism && detail.attachments.length === 0) return null;

  return (
    <Section title="Attachments">
      {detail.mechanism ? (
        <FileRow
          name={detail.mechanism}
          description="Promo mechanism"
          busy={pending?.type === 'mechanism'}
          onPress={() => onDownload({ type: 'mechanism', name: detail.mechanism ?? '' })}
        />
      ) : null}
      {detail.attachments.map((attachment) => (
        <FileRow
          key={attachment.id}
          name={attachment.file}
          description={attachment.description}
          busy={pending?.type === 'attachment' && pending.id === attachment.id}
          onPress={() =>
            onDownload({ type: 'attachment', id: attachment.id, name: attachment.file })
          }
        />
      ))}
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

function stepState(step: MarketingPromoStep): StepState {
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

/** Newest step first: the log comes oldest first, so the list is shown reversed. */
export function HistorySection({ detail }: { detail: MarketingPromoDetail }) {
  if (detail.approvements.length === 0) return null;

  const steps = [...detail.approvements].reverse();

  return (
    <Section title="Approval history">
      <View>
        {steps.map((step, index) => {
          const state = stepState(step);
          const last = index === steps.length - 1;

          return (
            <View key={`${step.tier}-${index}`} className="flex-row gap-3">
              <StepMarker state={state} last={last} />
              <View className={clsx('min-w-0 flex-1 gap-1', !last && 'pb-5')}>
                {step.action_at ? (
                  <AppText variant="caption" tone={state === 'rejected' ? 'danger' : 'success'}>
                    {formatDateTime(step.action_at)}
                  </AppText>
                ) : null}
                <View className="flex-row items-center gap-2">
                  <AppText variant="caption" tone="muted" className="min-w-0 shrink">
                    {step.user_name ?? step.tier}
                  </AppText>
                  <Badge size="sm" {...stepBadge(step.status)} />
                </View>
                {step.user_name ? (
                  <AppText variant="label" tone="muted">
                    {step.tier}
                  </AppText>
                ) : null}
                {step.remarks ? <AppText variant="label">{step.remarks}</AppText> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Section>
  );
}
