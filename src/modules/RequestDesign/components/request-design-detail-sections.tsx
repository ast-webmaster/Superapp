import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import { fileKey, type FileTarget } from '../hooks/use-request-design-file';
import type { RequestDesignDetail, RequestDesignStep } from '../types';
import { describeItem } from './item-text';
import { RequesterPill } from './requester-pill';
import { priorityBadge, statusBadge, stepBadge } from './status';

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

/** A label with a longer text under it, for what does not fit beside its label. */
function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="caption">{value}</AppText>
    </View>
  );
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function SummarySection({ detail }: { detail: RequestDesignDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.request_design_no}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.requester_name ?? detail.requester} />
          <Badge size="sm" {...statusBadge(detail.status)} />
          <Badge size="sm" {...priorityBadge(detail.priority)} />
          {detail.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.request_design_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: RequestDesignDetail }) {
  const rows: [string, string | null][] = [
    ['Due date', formatDate(detail.due_date)],
    [
      'New due date asked',
      detail.requested_due_date ? formatDate(detail.requested_due_date) : null,
    ],
    ['Brands', detail.brands.map((brand) => brand.category_name).join(', ') || null],
    ['Designer', detail.picked_by_name],
    ['Picked', detail.picked_at ? formatDateTime(detail.picked_at) : null],
    ['Result sent', detail.submit_date ? formatDateTime(detail.submit_date) : null],
    ['Approved by', detail.approved_by_name],
    ['Approved', detail.approved_at ? formatDateTime(detail.approved_at) : null],
  ];

  return (
    <Section title="Detail">
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      <TextBlock label="Theme or concept" value={detail.theme_concept} />
      <TextBlock label="Description" value={detail.description} />
      {divider}
      <DetailRow
        label="Total"
        value={`${plural(detail.items.length, 'item')} · ${plural(detail.total_qty, 'piece')}`}
      />
    </Section>
  );
}

/** A tappable file row: a reference of an item, or the designer's result. */
function FileRow({
  target,
  caption,
  pendingKey,
  onDownload,
}: {
  target: FileTarget;
  caption: string;
  pendingKey?: string;
  onDownload: (target: FileTarget) => void;
}) {
  const busy = pendingKey === fileKey(target);
  return (
    <Pressable
      role="button"
      aria-label={`Download ${target.name}`}
      disabled={pendingKey !== undefined}
      onPress={() => onDownload(target)}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-sm bg-surface-gray px-3 py-2 active:bg-border',
        focusRing,
      )}>
      <Icon name="doc" color="primary" />
      <View className="min-w-0 flex-1">
        <AppText variant="caption-strong" numberOfLines={1}>
          {target.name}
        </AppText>
        <AppText variant="label" tone="muted">
          {caption}
        </AppText>
      </View>
      {busy ? (
        <ActivityIndicator accessibilityLabel="Downloading" color={colors.primary} />
      ) : (
        <Icon name="download" color="ink-muted" />
      )}
    </Pressable>
  );
}

export interface FileActions {
  /** The id of the file being fetched, to show its row as busy. */
  pendingKey?: string;
  onDownload: (target: FileTarget) => void;
}

export function ItemsSection({
  detail,
  files,
}: {
  detail: RequestDesignDetail;
  files: FileActions;
}) {
  if (detail.items.length === 0) return null;

  return (
    <Section title={`Items (${detail.items.length})`}>
      {detail.items.map((item) => (
        <View key={item.id} className="gap-2 rounded-sm border border-border p-3">
          <View className="flex-row items-start justify-between gap-3">
            <AppText variant="caption-strong" className="min-w-0 flex-1">
              {describeItem(item)}
            </AppText>
            <AppText variant="caption-strong">{`${item.qty} pcs`}</AppText>
          </View>
          {item.remarks ? <AppText variant="label">{item.remarks}</AppText> : null}
          {item.references.map((reference) => (
            <FileRow
              key={reference.slot}
              target={{
                kind: 'reference',
                name: reference.name,
                itemId: item.id,
                slot: reference.slot,
              }}
              caption="Reference"
              pendingKey={files.pendingKey}
              onDownload={files.onDownload}
            />
          ))}
        </View>
      ))}
    </Section>
  );
}

/** The designer's finished work. Hidden until it is sent. */
export function ResultSection({
  detail,
  files,
  onOpenLink,
}: {
  detail: RequestDesignDetail;
  files: FileActions;
  onOpenLink: (url: string) => void;
}) {
  const { result } = detail;
  if (!result) return null;

  return (
    <Section title="Result">
      {result.type === 'FILE' ? (
        <FileRow
          target={{ kind: 'result', name: result.name }}
          caption="Designer's file"
          pendingKey={files.pendingKey}
          onDownload={files.onDownload}
        />
      ) : (
        <Pressable
          role="link"
          aria-label="Open the result link"
          onPress={() => onOpenLink(result.url)}
          className={clsx(
            'min-h-control flex-row items-center gap-3 rounded-sm bg-surface-gray px-3 py-2 active:bg-border',
            focusRing,
          )}>
          <Icon name="share" color="primary" />
          <View className="min-w-0 flex-1">
            <AppText variant="caption-strong" numberOfLines={1}>
              {result.url}
            </AppText>
            <AppText variant="label" tone="muted">
              Opens in your browser
            </AppText>
          </View>
        </Pressable>
      )}
    </Section>
  );
}

/** What the designer earns for this document. The server sends it only to designers and approvers. */
export function PointsSection({ detail }: { detail: RequestDesignDetail }) {
  const { points } = detail;
  if (!points) return null;
  const counted = points.categories.filter((category) => category.qty > 0);

  return (
    <Section title="Points">
      {counted.length === 0 ? (
        <AppText variant="caption" tone="muted">
          No points set yet.
        </AppText>
      ) : (
        counted.map((category) => (
          <DetailRow
            key={category.uuid}
            label={category.name}
            value={`${category.qty} × ${category.point} = ${category.amount}`}
          />
        ))
      )}
      {divider}
      <DetailRow label="Total points" value={String(points.total)} />
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

/** A pending row is the step still awaited; the log already lists it first (newest on top). */
function stepState(step: RequestDesignStep): StepState {
  if (step.pending) return 'current';
  const status = step.status ?? '';
  if (status.includes('REJECT') || status.includes('CANCEL')) return 'rejected';
  return step.action_at ? 'done' : 'upcoming';
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

/** The log arrives newest first, so it is shown in the order it comes. */
export function HistorySection({ steps }: { steps: RequestDesignStep[] }) {
  if (steps.length === 0) return null;

  return (
    <Section title="History">
      <View>
        {steps.map((step, index) => {
          const state = stepState(step);
          const last = index === steps.length - 1;

          return (
            <View key={`${step.role}-${step.name}-${index}`} className="flex-row gap-3">
              <StepMarker state={state} last={last} />
              <View className={clsx('min-w-0 flex-1 gap-1', !last && 'pb-5')}>
                {step.action_at ? (
                  <AppText variant="caption" tone={state === 'rejected' ? 'danger' : 'success'}>
                    {formatDateTime(step.action_at)}
                  </AppText>
                ) : null}
                {step.role ? (
                  <AppText variant="label" tone="muted">
                    {step.role}
                  </AppText>
                ) : null}
                <View className="flex-row items-center gap-2">
                  {step.name ? (
                    <AppText variant="caption" tone="muted" className="min-w-0 shrink">
                      {step.name}
                    </AppText>
                  ) : null}
                  {step.status ? <Badge size="sm" {...stepBadge(step.status)} /> : null}
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
