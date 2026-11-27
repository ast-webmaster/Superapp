import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import type {
  ProductBorrowingDetail,
  ProductBorrowingExtend,
  ProductBorrowingItem,
  ProductBorrowingStep,
} from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge, stepBadge } from './status';

const divider = <View role="separator" className="h-px bg-border" />;

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

/** One label and value on a line, the value right-aligned. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <AppText variant="caption" className="min-w-0 flex-1 text-right">
        {value}
      </AppText>
    </View>
  );
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function SummarySection({ detail }: { detail: ProductBorrowingDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.customer_name ?? detail.product_borrowing_no}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.requester_name ?? detail.requester} />
          <Badge size="sm" {...statusBadge(detail.status)} />
          {detail.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.product_borrowing_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: ProductBorrowingDetail }) {
  const rows: [string, string | null][] = [
    ['Customer', detail.customer_name],
    ['Address', detail.address],
    ['Phone', detail.phone],
    ['Received by', detail.pic_receiver],
    ['Note', detail.note],
    [
      'With',
      detail.last_updated_names.length > 0
        ? `${detail.last_updated_tier ?? ''} ${detail.last_updated_names.join(', ')}`.trim()
        : null,
    ],
  ];

  return (
    <Section title="Detail">
      <DetailRow label="Borrowing no" value={detail.product_borrowing_no} />
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {divider}
      <DetailRow
        label="Total"
        value={`${plural(detail.items.length, 'item')} · ${plural(detail.total_qty, 'unit')}`}
      />
    </Section>
  );
}

function ExtendBlock({ extend }: { extend: ProductBorrowingExtend }) {
  return (
    <View className="gap-1 rounded-sm bg-surface-gray p-3">
      <View className="flex-row items-center justify-between gap-2">
        <AppText variant="caption" className="min-w-0 flex-1">
          {`Until ${formatDate(extend.end_date)}`}
        </AppText>
        <Badge size="sm" {...stepBadge(extend.status)} />
      </View>
      {extend.reason ? (
        <AppText variant="label" tone="muted">
          {extend.reason}
        </AppText>
      ) : null}
    </View>
  );
}

function ItemBlock({ item }: { item: ProductBorrowingItem }) {
  const people = [
    item.product_manager_name ?? item.product_manager,
    item.marketing_name ?? item.marketing,
  ];

  return (
    <View className="gap-2 rounded-sm border border-border p-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <AppText variant="caption-strong">{item.product_name ?? item.product_code}</AppText>
          <AppText variant="label" tone="muted">
            {`${item.product_code} · ${item.warehouse}`}
          </AppText>
        </View>
        <Badge size="sm" {...stepBadge(item.status)} />
      </View>
      <DetailRow label="Quantity" value={String(item.qty)} />
      <DetailRow
        label="Borrowed"
        value={`${formatDate(item.start_date)} - ${formatDate(item.end_date)}`}
      />
      {item.estimate_return ? (
        <DetailRow label="Expected back" value={formatDate(item.estimate_return)} />
      ) : null}
      {item.received_date ? (
        <DetailRow label="Received back" value={formatDate(item.received_date)} />
      ) : null}
      {people[0] ? <DetailRow label="Product manager" value={people[0]} /> : null}
      {people[1] ? <DetailRow label="Processed by" value={people[1]} /> : null}
      {item.remarks ? (
        <AppText variant="label" tone="muted">
          {`Remarks: ${item.remarks}`}
        </AppText>
      ) : null}
      {item.extends.length > 0 ? (
        <View className="gap-2">
          <AppText variant="label" tone="muted">
            Extensions
          </AppText>
          {item.extends.map((extend) => (
            <ExtendBlock key={extend.id} extend={extend} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ItemsSection({ detail }: { detail: ProductBorrowingDetail }) {
  if (detail.items.length === 0) return null;

  return (
    <Section title={`Items (${detail.items.length})`}>
      {detail.items.map((item) => (
        <ItemBlock key={item.id} item={item} />
      ))}
    </Section>
  );
}

/** The printable document, fetched on the server. */
export function PdfSection({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  return (
    <Section title="Files">
      <Pressable
        role="button"
        aria-label="Download PDF"
        disabled={busy}
        onPress={onPress}
        className={clsx(
          'min-h-control flex-row items-center gap-3 rounded-sm bg-surface-gray px-3 py-2 active:bg-border',
          focusRing,
        )}>
        <Icon name="doc" color="primary" />
        <AppText variant="caption-strong" numberOfLines={1} className="min-w-0 flex-1">
          Borrowing form (PDF)
        </AppText>
        {busy ? (
          <ActivityIndicator accessibilityLabel="Downloading PDF" color={colors.primary} />
        ) : (
          <Icon name="download" color="ink-muted" />
        )}
      </Pressable>
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

/** The first step still waiting is the current one; the log lists the waiting steps last. */
function stepState(step: ProductBorrowingStep, firstWaiting: boolean): StepState {
  if (step.status === 'REJECTED') return 'rejected';
  if (step.action_at) return 'done';
  return firstWaiting ? 'current' : 'upcoming';
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
export function HistorySection({ steps }: { steps: ProductBorrowingStep[] }) {
  if (steps.length === 0) return null;

  const firstWaiting = steps.findIndex((step) => !step.action_at);
  const newestFirst = steps.map((step, index) => ({ step, index })).reverse();

  return (
    <Section title="Approval history">
      <View>
        {newestFirst.map(({ step, index }, position) => {
          const state = stepState(step, index === firstWaiting);
          const last = position === newestFirst.length - 1;

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
                  {(step.user_name ?? step.user_email) ? (
                    <AppText variant="caption" tone="muted" className="min-w-0 shrink">
                      {step.user_name ?? step.user_email}
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
