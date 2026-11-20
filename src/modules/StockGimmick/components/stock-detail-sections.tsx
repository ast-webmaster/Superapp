import type { ReactNode } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Badge, Button, ProductImage } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils/format';

import type { MovementSummary, StockDetail, StockMovement, StockTrack } from '../types';
import { formatQuantity, formatSignedQuantity } from './format';
import { MovementsSkeleton } from './stock-skeletons';

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

export function SummarySection({ detail }: { detail: StockDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-4">
        <ProductImage uri={detail.image_url} className="size-20 shrink-0" />
        <View className="min-w-0 flex-1 gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {detail.product_code}
          </AppText>
          <AppText variant="caption-strong" role="heading" numberOfLines={3}>
            {detail.product_name ?? detail.product_code}
          </AppText>
          {detail.office_name ? <Badge size="sm" icon="building" label={detail.office_name} /> : null}
        </View>
      </View>
    </Section>
  );
}

export function StockSection({ detail }: { detail: StockDetail }) {
  const rows: [string, string | null][] = [
    ['Last transaction', detail.last_transaction_label],
    ['Document', detail.last_transaction_no],
    ['Updated', detail.updated_at ? formatDateTime(detail.updated_at) : null],
  ];

  return (
    <Section title="Stock">
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          Quantity
        </AppText>
        <AppText variant="display">{formatQuantity(detail.qty)}</AppText>
      </View>
      {divider}
      {rows.map(([label, value]) => (
        <DetailRow key={label} label={label} value={value ?? '-'} />
      ))}
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 gap-1 pb-3">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="caption-strong">{value}</AppText>
    </View>
  );
}

function SummaryStats({ summary }: { summary: MovementSummary }) {
  const pending =
    summary.pending_count > 0
      ? `${formatQuantity(summary.pending_qty)} (${summary.pending_count} ${
          summary.pending_count === 1 ? 'document' : 'documents'
        })`
      : '0';

  return (
    <View className="flex-row flex-wrap">
      <Stat label="Total in" value={formatQuantity(summary.total_in)} />
      <Stat label="Total out" value={formatQuantity(summary.total_out)} />
      <Stat label="Returned" value={formatQuantity(summary.total_returned)} />
      <Stat label="Waiting for action" value={pending} />
    </View>
  );
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const meta = [movement.do_no, movement.party !== '-' ? movement.party : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="flex-row justify-between gap-4">
      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="caption-strong">{movement.event}</AppText>
        {meta ? (
          <AppText variant="label" tone="muted">
            {meta}
          </AppText>
        ) : null}
        {movement.occurred_at ? (
          <AppText variant="label" tone="muted">
            {formatDateTime(movement.occurred_at)}
          </AppText>
        ) : null}
        {movement.pending ? <Badge size="sm" tone="warning" label="Waiting for action" /> : null}
      </View>
      <View className="shrink-0 items-end gap-1">
        <AppText
          variant="title"
          tone={movement.qty > 0 ? 'success' : movement.qty < 0 ? 'danger' : 'muted'}>
          {formatSignedQuantity(movement.qty)}
        </AppText>
        <AppText variant="label" tone="muted">
          {`Balance ${formatQuantity(movement.balance)}`}
        </AppText>
      </View>
    </View>
  );
}

export interface MovementsSectionProps {
  track: StockTrack | undefined;
  error: unknown;
  /** The history query is waiting for a connection. */
  offline: boolean;
  onRetry: () => void;
}

/** Track Stock: every event of the row, newest first, each with the balance after it. */
export function MovementsSection({ track, error, offline, onRetry }: MovementsSectionProps) {
  if (track === undefined) {
    if (error || offline) {
      return (
        <Section title="History">
          <Alert
            tone="danger"
            message={
              error
                ? `Could not load the history. ${toAppError(error).message}`
                : 'You are offline. The history could not be loaded.'
            }
          />
          <Button variant="soft" onPress={onRetry}>
            Try again
          </Button>
        </Section>
      );
    }
    return <MovementsSkeleton />;
  }

  return (
    <Section title="History">
      <SummaryStats summary={track.summary} />
      {track.movements.length === 0 ? (
        <AppText variant="caption" tone="muted">
          No movements yet.
        </AppText>
      ) : (
        track.movements.map((movement, index) => (
          <View key={index} className="gap-3">
            {divider}
            <MovementRow movement={movement} />
          </View>
        ))
      )}
    </Section>
  );
}
