import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, IconButton } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { parseAmount } from '../../create/calculate-line';
import { draftTotal, itemAmounts, type StepKey } from '../../create/draft';
import type { PriceApprovalDraft } from '../../types';
import { formatFileSize } from './attachments-step';
import { discountLabel } from './items-step';

function Section({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <IconButton size="sm" icon="pencil" label={editLabel} onPress={onEdit} />
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">{children}</View>
    </View>
  );
}

/** A label over its value, so a long customer name wraps instead of being cut off. */
function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="body-strong">{value}</AppText>
    </View>
  );
}

export interface ReviewStepProps {
  draft: PriceApprovalDraft;
  requester: string;
  today: string;
  onEdit: (step: StepKey) => void;
}

export function ReviewStep({ draft, requester, today, onEdit }: ReviewStepProps) {
  return (
    <>
      <Section title="Details" editLabel="Edit details" onEdit={() => onEdit('details')}>
        <Pair label="Date" value={formatDate(today)} />
        <Pair label="Requested by" value={requester} />
        <Pair label="PO or SC" value={draft.poSc ?? ''} />
        {draft.poSc === 'PO' && draft.orderDate ? (
          <Pair label="Order date" value={formatDate(draft.orderDate)} />
        ) : null}
        <Pair label="Customer" value={draft.customer?.customer_name ?? ''} />
        <Pair label="Payment type" value={draft.paymentType ?? ''} />
        <Pair label="Category" value={draft.category ?? ''} />
        <Pair label="Shipment" value={draft.shipment ?? ''} />
        <Pair label="Shipping note" value={draft.shippingNote.trim()} />
        {draft.remarks.trim() ? <Pair label="Remarks" value={draft.remarks.trim()} /> : null}
      </Section>

      <Section
        title={`Items (${draft.items.length})`}
        editLabel="Edit items"
        onEdit={() => onEdit('items')}>
        {draft.items.map((item) => {
          const discount = discountLabel(item);
          return (
            <View key={item.id} className="gap-1">
              <View className="flex-row items-start justify-between gap-3">
                <AppText variant="body-strong" className="min-w-0 flex-1">
                  {item.product?.product_name ?? item.product?.sku_no ?? ''}
                </AppText>
                <AppText variant="body-strong">{formatMoney(itemAmounts(item).amount)}</AppText>
              </View>
              <AppText variant="caption" tone="muted">
                {`${item.product?.sku_no ?? ''} · ${parseAmount(item.qty)} × ${formatMoney(parseAmount(item.unitPrice))}`}
              </AppText>
              {discount ? (
                <AppText variant="caption" tone="muted">
                  {discount}
                </AppText>
              ) : null}
            </View>
          );
        })}
        <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
          <AppText variant="body-strong">Total</AppText>
          <AppText variant="title">{formatMoney(draftTotal(draft))}</AppText>
        </View>
      </Section>

      <Section
        title={`Attachments (${draft.attachments.length})`}
        editLabel="Edit attachments"
        onEdit={() => onEdit('attachments')}>
        {draft.attachments.length === 0 ? (
          <AppText tone="muted">No files attached.</AppText>
        ) : (
          draft.attachments.map(({ id, description, file }) => (
            <View key={id} className="gap-1">
              <AppText variant="body-strong">{description.trim()}</AppText>
              <AppText variant="caption" tone="muted">
                {file.size !== null ? `${file.name} · ${formatFileSize(file.size)}` : file.name}
              </AppText>
            </View>
          ))
        )}
      </Section>
    </>
  );
}
