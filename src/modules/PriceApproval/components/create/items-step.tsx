import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { parseAmount } from '../../create/calculate-line';
import { itemAmounts, MAX_ITEMS, type Errors } from '../../create/draft';
import type { DraftItem } from '../../types';

/** How an item's discount reads on a card, or null when it has none. */
export function discountLabel(item: DraftItem): string | null {
  const parts: string[] = [];
  if (item.discountKind === 'percent') parts.push(`${parseAmount(item.discountValue)}% discount`);
  if (item.discountKind === 'nominal') {
    parts.push(`${formatMoney(parseAmount(item.discountValue))} off`);
  }
  if (parseAmount(item.cashDiscount) > 0) {
    parts.push(`${parseAmount(item.cashDiscount)}% cash discount`);
  }
  return parts.length > 0 ? parts.join(', ') : null;
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
              Add each product this request is for.
            </AppText>
          </View>
        </View>
      ) : (
        items.map((item) => {
          const discount = discountLabel(item);
          const name = item.product?.product_name ?? item.product?.sku_no ?? '';
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
                {`${item.product?.sku_no ?? ''} · ${parseAmount(item.qty)} × ${formatMoney(parseAmount(item.unitPrice))}`}
              </AppText>
              {discount ? (
                <AppText variant="caption" tone="muted">
                  {discount}
                </AppText>
              ) : null}
              <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
                <AppText variant="caption" tone="muted">
                  Amount
                </AppText>
                <AppText variant="module-title">{formatMoney(itemAmounts(item).amount)}</AppText>
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
