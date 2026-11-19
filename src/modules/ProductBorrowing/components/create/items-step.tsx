import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { MAX_ITEMS, type Errors } from '../../create/draft';
import type { DraftItem } from '../../types';

/** The name an item goes by in lists and dialogs. */
export function itemName(item: DraftItem): string {
  return item.product?.product_name ?? item.product?.product_code ?? 'Item';
}

/** "2026-11-19 - 2026-11-26" as the user reads it, or null while no period is chosen. */
export function periodLabel(item: DraftItem): string | null {
  return item.startDate && item.endDate
    ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
    : null;
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
            <Icon name="box" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No items yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each product that is borrowed.
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
                {`${item.product?.product_code ?? ''} · ${item.warehouse ?? ''} · ${item.qty} pcs`}
              </AppText>
              {periodLabel(item) ? (
                <AppText variant="caption" tone="muted">
                  {periodLabel(item)}
                </AppText>
              ) : null}
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
