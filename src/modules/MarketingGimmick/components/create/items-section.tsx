import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';

import { MAX_ITEMS } from '../../create/draft';
import type { DraftItem } from '../../types';

/** The name an item goes by in lists and dialogs. */
export function itemName(row: DraftItem): string {
  return row.item?.name_item ?? row.item?.code_item ?? 'Item';
}

export interface ItemsSectionProps {
  items: DraftItem[];
  error?: string;
  onAdd: () => void;
  onEdit: (row: DraftItem) => void;
  onRemove: (row: DraftItem) => void;
}

export function ItemsSection({ items, error, onAdd, onEdit, onRemove }: ItemsSectionProps) {
  return (
    <View className="gap-3">
      <AppText variant="title" role="heading">
        Items
      </AppText>
      {error ? <Alert tone="danger" message={error} /> : null}
      {items.length === 0 ? (
        <View className="items-center gap-4 rounded-xl shadow-card bg-surface p-5">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="box" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No items yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each gimmick item and its quantity.
            </AppText>
          </View>
        </View>
      ) : (
        items.map((row) => {
          const name = itemName(row);
          return (
            <View key={row.id} className="gap-1 rounded-xl shadow-card bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <AppText variant="module-title" className="min-w-0 flex-1 pt-2">
                  {name}
                </AppText>
                <View className="flex-row gap-1">
                  <IconButton
                    size="xs"
                    icon="pencil"
                    label={`Edit ${name}`}
                    onPress={() => onEdit(row)}
                  />
                  <IconButton
                    size="xs"
                    icon="x"
                    label={`Remove ${name}`}
                    onPress={() => onRemove(row)}
                  />
                </View>
              </View>
              <AppText variant="caption" tone="muted">
                {`${row.item?.code_item ?? ''} · ${row.qty} pcs`}
              </AppText>
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
    </View>
  );
}
