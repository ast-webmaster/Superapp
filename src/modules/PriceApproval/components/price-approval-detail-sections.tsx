import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

import type { PriceApprovalDetail, PriceApprovalLine } from '../types';
import { CopyButton } from './copy-button';
import { RequesterPill } from './requester-pill';
import { discountBadge, sentenceCase, statusBadge, stepBadge } from './status';

const divider = <View role="separator" className="h-px bg-border" />;

/** One card of the detail screen. The screen spaces the cards with `gap-4`. */
function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl bg-surface p-4 shadow-card">
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
  trailing,
}: {
  label: string;
  value: string;
  strong?: boolean;
  /** Sits after the value, such as a copy button. */
  trailing?: ReactNode;
}) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <View className="min-w-0 flex-1 flex-row items-center justify-end gap-2">
        <AppText
          variant={strong ? 'caption-strong' : 'caption'}
          className="min-w-0 shrink text-right">
          {value}
        </AppText>
        {trailing}
      </View>
    </View>
  );
}

export function SummarySection({ detail }: { detail: PriceApprovalDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.customer_name ?? detail.customer_id ?? '-'}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.request_by_name ?? detail.request_by} />
          <Badge size="sm" {...statusBadge(detail.status)} />
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.pa_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: PriceApprovalDetail }) {
  const rows: [string, string | null][] = [
    ['Order date', detail.order_date ? formatDate(detail.order_date) : null],
    ['Payment', detail.payment_type],
    ['Category', detail.category],
    ['Shipment', detail.shipment],
    ['PO / SC', detail.po_sc],
    ['Assembly', detail.assembly_no],
    ['Remarks', detail.remarks],
    ['Shipping note', detail.shipping_note],
  ];

  return (
    <Section title="Detail">
      <DetailRow
        label="Request no"
        value={detail.pa_no}
        trailing={<CopyButton text={detail.pa_no} label="Copy request number" />}
      />
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {divider}
      <DetailRow strong label="Grand total" value={formatMoney(detail.grand_total)} />
    </Section>
  );
}

function ItemBlock({ line }: { line: PriceApprovalLine }) {
  const discounted = line.price_after_discount !== line.price;

  return (
    <View className="gap-2">
      <View className="gap-1">
        <AppText variant="caption-strong">{line.product_name ?? line.sku_no}</AppText>
        <AppText variant="caption" tone="muted">
          {line.sku_no}
        </AppText>
        {line.remark ? (
          <AppText variant="label" tone="muted">
            {`Remarks: ${line.remark}`}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" {...discountBadge(line)} />
        <Badge size="sm" icon="user" label={line.pm_name ?? line.pm} />
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <AppText variant="caption">
          {`${line.qty} unit x ${formatMoney(line.price_after_discount)}`}
        </AppText>
        {discounted ? (
          <AppText variant="label" tone="muted" className="line-through">
            {formatMoney(line.price)}
          </AppText>
        ) : null}
      </View>
      {line.cash_discount ? (
        <AppText variant="label" tone="muted">
          {`Cash discount ${line.cash_discount} %`}
        </AppText>
      ) : null}
      <View className="gap-1 pt-1">
        <AppText variant="label" tone="muted">
          Amount
        </AppText>
        <AppText variant="caption-strong">{formatMoney(line.amount)}</AppText>
      </View>
    </View>
  );
}

export function ItemsSection({ detail }: { detail: PriceApprovalDetail }) {
  if (detail.details.length === 0) return null;

  return (
    <Section title="Items">
      {detail.details.map((line, index) => (
        <View key={`${line.sku_no}-${index}`} className="rounded-lg border border-border p-3">
          <ItemBlock line={line} />
        </View>
      ))}
    </Section>
  );
}

export function HistorySection({ detail }: { detail: PriceApprovalDetail }) {
  if (detail.approvements.length === 0) return null;

  return (
    <Section title="Approval history">
      {detail.approvements.map((step, index) => (
        <View key={`${step.tier}-${index}`} className="gap-1">
          <View className="flex-row items-center justify-between gap-4">
            <AppText variant="caption" className="min-w-0 flex-1">
              {sentenceCase(step.tier)}
            </AppText>
            <Badge size="sm" {...stepBadge(step.status)} />
          </View>
          <AppText variant="label" tone="muted">
            {[step.user_name, step.action_at ? formatDateTime(step.action_at) : null]
              .filter(Boolean)
              .join(' · ') || 'Not acted on yet'}
          </AppText>
          {step.remarks ? <AppText variant="caption">{step.remarks}</AppText> : null}
        </View>
      ))}
    </Section>
  );
}
