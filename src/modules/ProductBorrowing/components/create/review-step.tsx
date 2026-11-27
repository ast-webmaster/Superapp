import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, IconButton } from '@/shared/ui';

import { totalQty, type StepKey } from '../../create/draft';
import type { ProductBorrowingDraft } from '../../types';
import { itemName, periodLabel } from './items-step';

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
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">{children}</View>
    </View>
  );
}

/** A label over its value, so a long address wraps instead of being cut off. */
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
  draft: ProductBorrowingDraft;
  onEdit: (step: StepKey) => void;
}

export function ReviewStep({ draft, onEdit }: ReviewStepProps) {
  return (
    <>
      <Section title="Details" editLabel="Edit details" onEdit={() => onEdit('details')}>
        <Pair
          label="Customer"
          value={draft.customer?.customer_name ?? draft.customer?.customer_id ?? '-'}
        />
        <Pair label="Delivery address" value={draft.address.trim()} />
        <Pair label="Phone" value={draft.phone.trim()} />
        <Pair label="Received by" value={draft.picReceiver.trim()} />
        <Pair label="Note" value={draft.note.trim()} />
      </Section>
      <Section
        title={`Items (${draft.items.length})`}
        editLabel="Edit items"
        onEdit={() => onEdit('items')}>
        {draft.items.map((item) => (
          <View key={item.id} className="gap-1">
            <AppText variant="body-strong">{itemName(item)}</AppText>
            <AppText variant="caption" tone="muted">
              {`${item.product?.product_code ?? ''} · ${item.warehouse ?? ''} · ${item.qty} pcs`}
            </AppText>
            <AppText variant="caption" tone="muted">
              {periodLabel(item) ?? ''}
            </AppText>
          </View>
        ))}
        <AppText variant="caption" tone="muted">
          {draft.items.some((item) => item.warehouse === 'Gudang Demo')
            ? `${totalQty(draft)} units in total. Demo warehouse stock is reserved as soon as you submit.`
            : `${totalQty(draft)} units in total.`}
        </AppText>
      </Section>
    </>
  );
}
