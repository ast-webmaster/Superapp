import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { parseAmount } from '../../create/amount';
import { itemAmount, itemName, MAX_ITEMS, type Errors } from '../../create/draft';
import type { DraftItem } from '../../types';

/** "2 × Rp 10,000 · Trade", the line under an item's name. */
export function itemSummary(item: DraftItem): string {
  const parts = [
    `${parseAmount(item.qty)} × ${formatMoney(parseAmount(item.unitPrice))}`,
    item.category ?? '',
  ];
  if (item.dueDate) parts.push(`needed by ${formatDate(item.dueDate)}`);
  return parts.filter(Boolean).join(' · ');
}

export interface ItemsStepProps {
  items: DraftItem[];
  errors: Errors;
  onAdd: () => void;
  onEdit: (item: DraftItem) => void;
  onRemove: (item: DraftItem) => void;
}

export function ItemsStep({ items, errors, onAdd, onEdit, onRemove }: ItemsStepProps) {
  return (
    <>
      {errors.items ? <Alert tone="danger" message={errors.items} /> : null}
      {items.length === 0 ? (
        <View className="items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="cart" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No items yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each item this request is for.
            </AppText>
          </View>
        </View>
      ) : (
        items.map((item) => {
          const name = itemName(item);
          return (
            <View key={item.id} className="gap-2 rounded-xl border border-border bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <AppText variant="module-title" className="min-w-0 flex-1 pt-2">
                  {name}
                </AppText>
                <View className="flex-row gap-1">
                  <IconButton
                    size="xs"
                    icon="pencil"
                    label={`Edit ${name}`}
                    onPress={() => onEdit(item)}
                  />
                  <IconButton
                    size="xs"
                    icon="x"
                    label={`Remove ${name}`}
                    onPress={() => onRemove(item)}
                  />
                </View>
              </View>
              <AppText variant="caption" tone="muted">
                {itemSummary(item)}
              </AppText>
              {item.document ? (
                <AppText variant="caption" tone="muted" numberOfLines={1}>
                  {`Document: ${item.document.name}`}
                </AppText>
              ) : null}
              <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
                <AppText variant="caption" tone="muted">
                  Amount
                </AppText>
                <AppText variant="module-title">{formatMoney(itemAmount(item))}</AppText>
              </View>
            </View>
          );
        })
      )}
      <Button
        variant="soft"
        block
        iconLeft="plus"
        disabled={items.length >= MAX_ITEMS}
        onPress={onAdd}>
        Add item
      </Button>
    </>
  );
}
