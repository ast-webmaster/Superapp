import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, Icon, Loading } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import type { RegisterCustomerFile } from '../hooks/use-register-customer-file';
import type { RegisterCustomerDetail, RegisterCustomerStep } from '../types';
import { statusBadge, stepBadge } from './status';

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

/** One label and value on a line, the value right-aligned. */
function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
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

export function SummarySection({ detail }: { detail: RegisterCustomerDetail }) {
  return (
    <Section>
      <View className="flex-row items-center gap-3">
        <View className="h-6 w-1 rounded-pill bg-primary" />
        <AppText variant="caption-strong" role="heading" className="min-w-0 flex-1">
          {detail.customer_name}
        </AppText>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" {...statusBadge(detail.status)} />
        {detail.awaiting_me ? (
          <Badge size="sm" tone="info" icon="bell" label="Waiting for you" />
        ) : null}
      </View>
      <DetailRow label="Number" value={detail.register_customer_no} />
      <DetailRow label="Registered" value={formatDate(detail.register_date)} />
      <DetailRow label="Requested by" value={detail.requester_name ?? detail.requester} />
      <DetailRow label="Customer code" value={detail.customer_code} />
      <DetailRow label="With" value={detail.last_updated_names} />
    </Section>
  );
}

export function CustomerSection({ detail }: { detail: RegisterCustomerDetail }) {
  return (
    <Section title="Customer">
      <DetailRow label="Category" value={detail.category} />
      <DetailRow label="Business form" value={detail.forms_of_business} />
      <DetailRow label="Business status" value={detail.status_of_business} />
      <DetailRow
        label="Established"
        value={detail.date_of_incorporation ? formatDate(detail.date_of_incorporation) : null}
      />
      <DetailRow label="Tax status" value={detail.taxation_status} />
      <DetailRow label="Tax ID (NPWP)" value={detail.tax_id_number} />
      <DetailRow label="ID card number" value={detail.business_id_card_number} />
      <DetailRow label="Business ID (NIB)" value={detail.business_id_number} />
      <DetailRow label="Phone" value={detail.phone} />
      <DetailRow label="Fax" value={detail.fax} />
      <DetailRow label="Website" value={detail.website} />
      <DetailRow label="Address" value={detail.customer_address} />
      <DetailRow
        label="Shipping address"
        value={
          detail.shipping_address_type === 'SAME' ? 'Same as address' : detail.shipping_address
        }
      />
      <DetailRow
        label="Group"
        value={
          detail.is_grouping === 'YES'
            ? (detail.grouping_company_name ?? 'Yes')
            : detail.is_grouping === 'NO'
              ? 'No'
              : null
        }
      />
    </Section>
  );
}

export function ContactSection({ detail }: { detail: RegisterCustomerDetail }) {
  return (
    <>
      <Section title="Contact person">
        <DetailRow label="Name" value={detail.pic_name} />
        <DetailRow label="Department" value={detail.pic_department} />
        <DetailRow label="Phone" value={detail.pic_number} />
        <DetailRow label="Email" value={detail.pic_email} />
      </Section>
      <Section title="Owner">
        <DetailRow label="Name" value={detail.owner_name} />
        <DetailRow label="ID card number" value={detail.id_card_number} />
        <DetailRow label="Address" value={detail.owner_address} />
        <DetailRow
          label="Current address"
          value={
            detail.owner_address_now_type === 'SAME' ? 'Same as address' : detail.owner_address_now
          }
        />
      </Section>
    </>
  );
}

function FileRow({
  title,
  name,
  caption,
  busy,
  onPress,
}: {
  title: string;
  name: string;
  caption?: string | null;
  busy: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      aria-label={`Download ${title}`}
      aria-busy={busy}
      disabled={busy}
      onPress={onPress}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-sm border border-border p-3 active:bg-surface-gray',
        focusRing,
      )}>
      <View className="size-10 items-center justify-center rounded-md bg-primary-soft">
        <Icon name="doc" color="primary" />
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="body-strong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {caption ? `${name} · ${caption}` : name}
        </AppText>
      </View>
      {busy ? <Loading /> : <Icon name="download" color="ink-muted" />}
    </Pressable>
  );
}

type FilesProps = {
  detail: RegisterCustomerDetail;
  pending: RegisterCustomerFile | undefined;
  onDownload: (file: RegisterCustomerFile) => void;
};

export function DocumentsSection({ detail, pending, onDownload }: FilesProps) {
  if (detail.documents.length === 0 && detail.attachments.length === 0) return null;

  return (
    <Section title="Documents">
      {detail.documents.map((document) => (
        <FileRow
          key={document.key}
          title={document.label}
          name={document.file}
          busy={pending?.kind === 'document' && pending.key === document.key}
          onPress={() => onDownload({ kind: 'document', key: document.key, name: document.file })}
        />
      ))}
      {detail.attachments.map((attachment) => (
        <FileRow
          key={attachment.id}
          title={attachment.description || 'Attachment'}
          name={attachment.file}
          caption={attachment.uploaded_by}
          busy={pending?.kind === 'attachment' && pending.id === attachment.id}
          onPress={() =>
            onDownload({ kind: 'attachment', id: attachment.id, name: attachment.file })
          }
        />
      ))}
    </Section>
  );
}

type StepState = 'done' | 'rejected' | 'current' | 'upcoming';

function stepState(step: RegisterCustomerStep): StepState {
  if (step.status === 'REJECTED') return 'rejected';
  if (step.action_at) return 'done';
  return step.status.startsWith('AWAITING') ? 'current' : 'upcoming';
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

/** Newest step first: the log comes oldest first, so it is shown reversed. */
export function HistorySection({ detail }: { detail: RegisterCustomerDetail }) {
  if (detail.approvements.length === 0) return null;

  const steps = [...detail.approvements].reverse();

  return (
    <Section title="Approval history">
      <View>
        {steps.map((step, index) => {
          const state = stepState(step);
          const last = index === steps.length - 1;

          return (
            <View key={`${step.status}-${index}`} className="flex-row gap-3">
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
