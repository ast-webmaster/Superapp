import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

import type { MarketingActivityFile } from '../hooks/use-marketing-activity-file';
import type {
  MarketingActivityDetail,
  MarketingActivityStep,
  MarketingActivitySupport,
} from '../types';
import { ApplicantPill } from './applicant-pill';
import { statusBadge, stepBadge } from './status';

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

export function SummarySection({ detail }: { detail: MarketingActivityDetail }) {
  return (
    <Section>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {`${detail.activity_no} - ${formatDate(detail.activity_date)}`}
        </AppText>
        <View className="flex-row items-center gap-3">
          <View className="h-6 w-1 rounded-pill bg-primary" />
          <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
            {detail.activity_name}
          </AppText>
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        {detail.sign_of_applicant_name ? (
          <ApplicantPill name={detail.sign_of_applicant_name} />
        ) : null}
        <Badge size="sm" {...statusBadge(detail.status)} />
      </View>
      {detail.brands.length > 0 ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {detail.brands.map((brand) => (
            <Badge key={brand.mkt_code} size="sm" label={brand.name} />
          ))}
        </View>
      ) : null}
    </Section>
  );
}

export function InfoSection({ detail }: { detail: MarketingActivityDetail }) {
  const period =
    detail.start_of_activity_period && detail.end_of_activity_period
      ? `${formatDate(detail.start_of_activity_period)} - ${formatDate(detail.end_of_activity_period)}`
      : null;
  const rows: [string, string | null][] = [
    [
      'Type',
      [detail.category_name ?? detail.category, detail.activity_type].filter(Boolean).join(' - ') ||
        null,
    ],
    ['Customer', detail.customer_name],
    ['Place', detail.activity_place],
    ['Offices', detail.offices.join(', ') || null],
    ['Period', period],
    ['Number of days', detail.target_period],
    ['Tax', detail.tax],
    ['Tax insurer', detail.tax_payer],
    ['PR no', detail.pr_no],
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
      {detail.activity_note ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Note
          </AppText>
          <AppText variant="caption">{detail.activity_note}</AppText>
        </View>
      ) : null}
      {detail.activity_note_realization ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Realization note
          </AppText>
          <AppText variant="caption">{detail.activity_note_realization}</AppText>
        </View>
      ) : null}
    </Section>
  );
}

/** Who pays what share. Shown only when the activity has a split. */
export function SupportShareSection({ detail }: { detail: MarketingActivityDetail }) {
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

function SupportBlock({ line }: { line: MarketingActivitySupport }) {
  const realized = line.total_realization !== null;

  return (
    <View className="gap-1">
      <AppText variant="caption-strong">{line.activity_support}</AppText>
      {line.covered_by ? <Badge size="sm" label={line.covered_by} /> : null}
      <AppText variant="caption">{`${line.qty} x ${formatMoney(line.unit_price)} = ${formatMoney(line.total)}`}</AppText>
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

export function CostsSection({ detail }: { detail: MarketingActivityDetail }) {
  return (
    <Section title={`Costs (${detail.supports.length})`}>
      {detail.supports.map((line, index) => (
        <View
          key={`${line.activity_support}-${index}`}
          className="rounded-lg border border-border p-3">
          <SupportBlock line={line} />
        </View>
      ))}
      {divider}
      <DetailRow strong label="Estimated total" value={formatMoney(detail.estimated_total_cost)} />
      {detail.real_total_cost > 0 ? (
        <DetailRow label="Real total" value={formatMoney(detail.real_total_cost)} />
      ) : null}
      {detail.revision_total_cost !== 0 ? (
        <DetailRow label="Revision total" value={formatMoney(detail.revision_total_cost)} />
      ) : null}
      {detail.additional_total_cost !== 0 ? (
        <DetailRow label="Additional cost" value={formatMoney(detail.additional_total_cost)} />
      ) : null}
      {detail.ratio_cost ? <DetailRow label="Cost ratio" value={`${detail.ratio_cost}%`} /> : null}
      {detail.ratio_cost_realization ? (
        <DetailRow label="Realized cost ratio" value={`${detail.ratio_cost_realization}%`} />
      ) : null}
    </Section>
  );
}

/** 1500 -> "1,500": the same grouping as `formatMoney`, without the currency. */
const formatNumber = (value: number) => formatMoney(value).replace(/^(-?)Rp /, '$1');

export function TargetsSection({ detail }: { detail: MarketingActivityDetail }) {
  if (detail.targets.length === 0) return null;

  return (
    <Section title="Targets">
      {detail.targets.map((target, index) => {
        // Only the NOMINAL indicator is money; others (participants, outlets) are plain counts.
        const format = target.indicator === 'NOMINAL' ? formatMoney : formatNumber;

        return (
          <View key={`${target.indicator}-${index}`} className="gap-1">
            <AppText variant="caption-strong">{target.indicator}</AppText>
            <DetailRow
              label="Estimate"
              value={target.estimate_value === null ? '-' : format(target.estimate_value)}
            />
            {target.realization_value !== null ? (
              <DetailRow label="Realization" value={format(target.realization_value)} />
            ) : null}
          </View>
        );
      })}
    </Section>
  );
}

/** Money, or a dash when the figure is missing or zero (the web shows the same). */
const moneyOrDash = (value: number | null) => (value ? formatMoney(value) : '-');

export function SalesRevenueSection({ detail }: { detail: MarketingActivityDetail }) {
  const { months, total_sellin, average_three_month, average_last_year, note } =
    detail.last_sales_revenue;

  return (
    <Section title="Last sales revenue">
      {months.map((month) => (
        <DetailRow key={month.label} label={month.label} value={moneyOrDash(month.value)} />
      ))}
      {divider}
      <DetailRow strong label="Total sell in" value={moneyOrDash(total_sellin)} />
      <DetailRow strong label="Average revenue 3 months" value={moneyOrDash(average_three_month)} />
      <DetailRow strong label="Previous year average" value={moneyOrDash(average_last_year)} />
      {note ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Note
          </AppText>
          <AppText variant="caption">{note}</AppText>
        </View>
      ) : null}
    </Section>
  );
}

export function FinanceSection({ detail }: { detail: MarketingActivityDetail }) {
  if (detail.finance_informations.length === 0) return null;

  return (
    <Section title={`Finance information (${detail.finance_informations.length})`}>
      {detail.finance_informations.map((row) => {
        const active = row.status === 'ACTIVE';
        // formatMoney writes rupiah; a foreign currency swaps the prefix.
        const usage = formatMoney(row.total_cn_usage).replace('Rp', row.currency ?? 'Rp');

        return (
          <View key={row.id} className="gap-2 rounded-lg border border-border p-3">
            <View className="flex-row items-center justify-between gap-3">
              <AppText variant="caption-strong" className="min-w-0 flex-1" numberOfLines={1}>
                {row.inv_ar_no ?? '-'}
              </AppText>
              <Badge
                size="sm"
                tone={active ? 'success' : 'neutral'}
                label={active ? 'Active' : 'Inactive'}
              />
            </View>
            {row.cn_no ? <DetailRow label="CN no" value={row.cn_no} /> : null}
            <DetailRow label="Total CN" value={usage} />
            {row.exchange_rate ? (
              <DetailRow label="Exchange rate" value={formatMoney(row.exchange_rate)} />
            ) : null}
            <DetailRow label="Total CN rupiah" value={formatMoney(row.total_cn_final)} />
          </View>
        );
      })}
      {divider}
      <DetailRow strong label="Grand total" value={formatMoney(detail.finance_total)} />
    </Section>
  );
}

/** Each attachment is a row the user taps to download: a download icon, or a spinner while it loads. */
export function AttachmentsSection({
  detail,
  onDownload,
  pending,
}: {
  detail: MarketingActivityDetail;
  onDownload: (file: MarketingActivityFile) => void;
  /** The file being fetched, to show its row as busy. */
  pending: MarketingActivityFile | undefined;
}) {
  if (detail.attachments.length === 0) return null;

  return (
    <Section title="Attachments">
      {detail.attachments.map((attachment) => {
        const busy = pending?.type === 'attachment' && pending.id === attachment.id;

        return (
          <Pressable
            key={attachment.id}
            role="button"
            aria-label={`Download ${attachment.file}`}
            disabled={busy}
            onPress={() =>
              onDownload({ type: 'attachment', id: attachment.id, name: attachment.file })
            }
            className={clsx(
              'min-h-control flex-row items-center gap-3 rounded-lg bg-surface-gray px-3 py-2 active:bg-border',
              focusRing,
            )}>
            <Icon name="doc" color="primary" />
            <View className="min-w-0 flex-1">
              <AppText variant="caption-strong" numberOfLines={1}>
                {attachment.file}
              </AppText>
              {attachment.description ? (
                <AppText variant="label" tone="muted" numberOfLines={2}>
                  {attachment.description}
                </AppText>
              ) : null}
            </View>
            {busy ? (
              <ActivityIndicator
                accessibilityLabel={`Downloading ${attachment.file}`}
                color={colors.primary}
              />
            ) : (
              <Icon name="download" color="ink-muted" />
            )}
          </Pressable>
        );
      })}
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

function stepState(step: MarketingActivityStep): StepState {
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
export function HistorySection({ detail }: { detail: MarketingActivityDetail }) {
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
