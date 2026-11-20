import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Alert, AppText, Badge } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/format';

import type { CustomerDetail } from '../types';

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
function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <AppText variant="caption" className="min-w-0 flex-1 text-right">
        {value || '-'}
      </AppText>
    </View>
  );
}

/** An address on its own lines, because it is too long for a right-aligned value. */
function AddressBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="caption">{value || '-'}</AppText>
    </View>
  );
}

function Rows({ rows }: { rows: [string, string | null][] }) {
  return rows.map(([label, value]) => <DetailRow key={label} label={label} value={value} />);
}

/** `SAME` and `DIFFERENT` are the server's words for "same as the main address". */
function sameAsMain(type: string | null) {
  return type === 'SAME' ? 'Same as the main address' : null;
}

/** Shown while a change waits for finance. The server tells who asked and when, never what. */
export function LockedAlert({ detail }: { detail: CustomerDetail }) {
  if (!detail.is_locked) return null;
  const change = detail.pending_change;
  const when = change?.requested_at ? ` on ${formatDateTime(change.requested_at)}` : '';
  const who = change?.requested_by ? ` Requested by ${change.requested_by}${when}.` : '';

  return <Alert tone="info" message={`A change is waiting for finance approval.${who}`} />;
}

export function SummarySection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          {detail.customer_id}
        </AppText>
        <AppText variant="caption-strong" role="heading">
          {detail.customer_name}
        </AppText>
      </View>
      {detail.category || detail.taxation_status ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {detail.category ? <Badge size="sm" label={detail.category} /> : null}
          {detail.taxation_status ? (
            <Badge size="sm" tone="neutral" label={detail.taxation_status} />
          ) : null}
        </View>
      ) : null}
    </Section>
  );
}

export function ContactSection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section title="Contact">
      <Rows
        rows={[
          ['Phone', detail.phone],
          ['Fax', detail.fax],
          ['WhatsApp', detail.whatsapp_no],
          ['WhatsApp 2', detail.whatsapp_no_second],
          ['Website', detail.website],
        ]}
      />
    </Section>
  );
}

export function PicSection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section title="Person in charge">
      <Rows
        rows={[
          ['Name', detail.pic_name],
          ['Department', detail.pic_department],
          ['Phone', detail.pic_number],
          ['Email', detail.pic_email],
        ]}
      />
    </Section>
  );
}

export function AddressSection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section title="Addresses">
      <AddressBlock label="Main address" value={detail.customer_address} />
      <AddressBlock
        label="Shipping address"
        value={sameAsMain(detail.shipping_address_type) ?? detail.shipping_address}
      />
      {detail.addresses.map((extra, index) => (
        <AddressBlock key={extra.uuid} label={`Other address ${index + 1}`} value={extra.address} />
      ))}
    </Section>
  );
}

export function BusinessSection({ detail }: { detail: CustomerDetail }) {
  const grouped = detail.is_grouping === 'YES';
  const rows: [string, string | null][] = [
    ['Office', detail.office_name ?? detail.office_code],
    ['Business status', detail.status_of_business],
    ['Business form', detail.forms_of_business],
    [
      'Incorporated',
      detail.date_of_incorporation ? formatDate(detail.date_of_incorporation) : null,
    ],
    ['Tax status', detail.taxation_status],
    ['Tax ID', detail.tax_id_number],
    ['Business ID', detail.business_id_number],
    ['Part of a group', detail.is_grouping === null ? null : grouped ? 'Yes' : 'No'],
  ];
  if (grouped) rows.push(['Group company', detail.grouping_company_name]);

  return (
    <Section title="Business">
      <Rows rows={rows} />
    </Section>
  );
}

export function OwnerSection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section title="Owner">
      <Rows
        rows={[
          ['Name', detail.owner_name],
          ['ID card', detail.id_card_number],
        ]}
      />
      <AddressBlock label="Owner address" value={detail.owner_address} />
      <AddressBlock
        label="Current address"
        value={sameAsMain(detail.owner_address_now_type) ?? detail.owner_address_now}
      />
    </Section>
  );
}

export function InfoSection({ detail }: { detail: CustomerDetail }) {
  return (
    <Section title="Record">
      <Rows
        rows={[
          ['Created', detail.created_at ? formatDateTime(detail.created_at) : null],
          ['Updated', detail.updated_at ? formatDateTime(detail.updated_at) : null],
          ['Updated by', detail.updated_by],
        ]}
      />
    </Section>
  );
}
