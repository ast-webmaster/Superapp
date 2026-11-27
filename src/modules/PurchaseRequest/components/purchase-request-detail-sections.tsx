import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { colors } from '@/shared/theme/tokens';
import { AppText, Badge, focusRing, Icon } from '@/shared/ui';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';

import type {
  PurchaseRequestAttachment,
  PurchaseRequestDetail,
  PurchaseRequestLine,
  PurchaseRequestStep,
} from '../types';
import type { PurchaseRequestFile } from '../hooks/use-purchase-request-file';
import { RequesterPill } from './requester-pill';
import { statusBadge, stepBadge } from './status';

const divider = <View role="separator" className="h-px bg-border" />;

type Download = {
  onDownload: (file: PurchaseRequestFile) => void;
  /** The file being fetched, to show its row as busy. */
  pending: PurchaseRequestFile | undefined;
};

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

export function SummarySection({ detail }: { detail: PurchaseRequestDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.purpose ?? detail.pr_no}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
          <RequesterPill name={detail.requester_name ?? detail.requester} />
          <Badge size="sm" {...statusBadge(detail.status)} />
        </View>
        <AppText variant="label" tone="muted" className="shrink-0">
          {formatDate(detail.pr_date)}
        </AppText>
      </View>
    </Section>
  );
}

export function InfoSection({ detail }: { detail: PurchaseRequestDetail }) {
  const rows: [string, string | null][] = [
    ['Category', detail.category],
    ['Payment', detail.payment_method],
    ['Department', detail.department_name],
    ['Reference', detail.reference],
    ['Destination', detail.destination],
    ['Remarks', detail.remarks],
    ['Last updated by', detail.last_updated_name],
  ];

  return (
    <Section title="Detail">
      <DetailRow label="Request no" value={detail.pr_no} />
      {rows
        .filter((row): row is [string, string] => Boolean(row[1]))
        .map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      {detail.from_assembly ? <DetailRow label="Source" value="Assembly" /> : null}
      {divider}
      <DetailRow strong label="Grand total" value={formatMoney(detail.grand_total)} />
    </Section>
  );
}

/** Vendor and delivery address, each shown only when the request has it. */
export function PartiesSection({ detail }: { detail: PurchaseRequestDetail }) {
  const { vendor, delivery_address: office } = detail;
  if (!vendor && !office && !detail.vendor_reference) return null;

  return (
    <Section title="Vendor and delivery">
      {vendor ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Vendor
          </AppText>
          <AppText variant="caption-strong">{vendor.company_name ?? '-'}</AppText>
          {vendor.address ? <AppText variant="caption">{vendor.address}</AppText> : null}
          {vendor.phone ? (
            <AppText variant="caption" tone="muted">
              {vendor.phone}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {detail.vendor_reference ? (
        <DetailRow label="Vendor reference" value={detail.vendor_reference} />
      ) : null}
      {vendor && office ? divider : null}
      {office ? (
        <View className="gap-1">
          <AppText variant="label" tone="muted">
            Deliver to
          </AppText>
          <AppText variant="caption-strong">{office.office_name ?? '-'}</AppText>
          {office.address ? <AppText variant="caption">{office.address}</AppText> : null}
          {office.phone ? (
            <AppText variant="caption" tone="muted">
              {office.phone}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Section>
  );
}

function ItemBlock({ line, download }: { line: PurchaseRequestLine } & { download: Download }) {
  const file: PurchaseRequestFile | null = line.document
    ? { kind: 'document', id: line.id, name: line.document }
    : null;

  return (
    <View className="gap-2">
      <View className="gap-1">
        <AppText variant="caption-strong">
          {line.item_description ?? line.item_no ?? line.item_code ?? '-'}
        </AppText>
        {line.item_no && line.item_no !== line.item_description ? (
          <AppText variant="caption" tone="muted">
            {line.item_no}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        {line.category ? <Badge size="sm" label={line.category} /> : null}
        {line.status_purchase ? <Badge size="sm" tone="info" label={line.status_purchase} /> : null}
      </View>
      <AppText variant="caption">
        {`${line.qty}${line.uom ? ` ${line.uom}` : ' unit'} x ${formatMoney(line.unit_price)}`}
      </AppText>
      {line.last_price > 0 ? (
        <AppText variant="label" tone="muted">
          {`Last price ${formatMoney(line.last_price)}`}
        </AppText>
      ) : null}
      {line.stock_on_hand !== null ? (
        <AppText variant="label" tone="muted">
          {`Stock on hand ${line.stock_on_hand}`}
        </AppText>
      ) : null}
      {line.due_date ? (
        <AppText variant="label" tone="muted">
          {`Needed by ${formatDate(line.due_date)}`}
        </AppText>
      ) : null}
      {line.received_at ? (
        <AppText variant="label" tone="muted">
          {`Received ${formatDate(line.received_at)}`}
        </AppText>
      ) : null}
      {line.remarks ? (
        <AppText variant="label" tone="muted">
          {`Remarks: ${line.remarks}`}
        </AppText>
      ) : null}
      {file ? (
        <FileRow
          name={file.name}
          caption="Supporting document"
          busy={download.pending?.kind === 'document' && download.pending.id === file.id}
          onPress={() => download.onDownload(file)}
        />
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

export function ItemsSection({
  detail,
  ...download
}: { detail: PurchaseRequestDetail } & Download) {
  if (detail.items.length === 0) return null;

  return (
    <Section title={`Items (${detail.items.length})`}>
      {detail.items.map((line) => (
        <View key={line.id} className="rounded-sm border border-border p-3">
          <ItemBlock line={line} download={download} />
        </View>
      ))}
    </Section>
  );
}

export function AttachmentsSection({
  detail,
  ...download
}: { detail: PurchaseRequestDetail } & Download) {
  if (detail.attachments.length === 0) return null;

  return (
    <Section title="Attachments">
      {detail.attachments.map((attachment: PurchaseRequestAttachment) => (
        <FileRow
          key={attachment.id}
          name={attachment.file}
          caption={attachment.description}
          busy={download.pending?.kind === 'attachment' && download.pending.id === attachment.id}
          onPress={() =>
            download.onDownload({ kind: 'attachment', id: attachment.id, name: attachment.file })
          }
        />
      ))}
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

function stepState(step: PurchaseRequestStep): StepState {
  if (step.status === 'REJECTED') return 'rejected';
  if (step.approved_at) return 'done';
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
export function HistorySection({ detail }: { detail: PurchaseRequestDetail }) {
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
                {step.approved_at ? (
                  <AppText variant="caption" tone={state === 'rejected' ? 'danger' : 'success'}>
                    {formatDateTime(step.approved_at)}
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
