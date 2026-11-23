import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import type { FlowConfig } from '../flows';
import type { GimmickAttachment, GimmickDetail, GimmickStep } from '../types';
import { RequesterPill } from './requester-pill';
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

export function SummarySection({ detail }: { detail: GimmickDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.do_no}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.requester_name ?? detail.requester} />
          <Badge size="sm" {...statusBadge(detail.status)} />
          {detail.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.do_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: GimmickDetail }) {
  const rows: [string, string | null][] = [
    ['From', detail.sender_name],
    ['To', detail.receiver_name],
    ['Remarks', detail.remarks],
    ['Approver remarks', detail.remarks_approve],
  ];

  return (
    <Section title="Detail">
      <DetailRow label="Document no" value={detail.do_no} />
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

export function ItemsSection({ detail }: { detail: GimmickDetail }) {
  if (detail.items.length === 0) return null;

  return (
    <Section title={`Items (${detail.items.length})`}>
      {detail.items.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center justify-between gap-3 rounded-lg border border-border p-3">
          <View className="min-w-0 flex-1">
            <AppText variant="caption-strong">{item.name_item ?? item.code_item}</AppText>
            <AppText variant="label" tone="muted">
              {item.code_item}
            </AppText>
          </View>
          <AppText variant="caption-strong">{`${item.qty} pcs`}</AppText>
        </View>
      ))}
    </Section>
  );
}

export interface FilesSectionProps {
  flow: FlowConfig;
  files: GimmickAttachment[];
  /** The file being fetched, to show its row as busy. */
  pending?: GimmickAttachment;
  onDownload: (file: GimmickAttachment) => void;
}

/** The files of the document. Hidden when it has none (a request's attachment is optional). */
export function FilesSection({ flow, files, pending, onDownload }: FilesSectionProps) {
  if (files.length === 0) return null;

  return (
    <Section title="Files">
      {files.map((file) => {
        const busy = pending?.slot === file.slot;
        return (
          <Pressable
            key={file.slot}
            role="button"
            aria-label={`Download ${file.name}`}
            disabled={pending !== undefined}
            onPress={() => onDownload(file)}
            className={clsx(
              'min-h-control flex-row items-center gap-3 rounded-lg bg-surface-gray px-3 py-2 active:bg-border',
              focusRing,
            )}>
            <Icon name="doc" color="primary" />
            <View className="min-w-0 flex-1">
              <AppText variant="caption-strong" numberOfLines={1}>
                {file.name}
              </AppText>
              <AppText variant="label" tone="muted">
                {file.slot === 'doc' ? flow.docLabel : 'Receipt proof'}
              </AppText>
            </View>
            {busy ? (
              <ActivityIndicator accessibilityLabel="Downloading" color={colors.primary} />
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

/** A pending row is the step still awaited; the log already lists it first (newest on top). */
function stepState(step: GimmickStep): StepState {
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
export function HistorySection({ steps }: { steps: GimmickStep[] }) {
  if (steps.length === 0) return null;

  return (
    <Section title="Approval history">
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
