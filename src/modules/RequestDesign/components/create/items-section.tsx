import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';

import { MAX_ITEMS, validateItem } from '../../create/draft';
import type { DraftItem } from '../../types';
import { describeItem } from '../item-text';

/** The name an item goes by in lists and dialogs. */
export function itemName(row: DraftItem): string {
  return describeItem(row);
}

export interface ItemsSectionProps {
  items: DraftItem[];
  error?: string;
  /** Once the user has tried to submit, an unfinished item says so. */
  attempted: boolean;
  onAdd: () => void;
  onEdit: (row: DraftItem) => void;
  onRemove: (row: DraftItem) => void;
}

const fileCount = (row: DraftItem) =>
  row.files.filter(Boolean).length +
  row.kept.filter((name, slot) => name && !row.files[slot]).length;

export function ItemsSection({
  items,
  error,
  attempted,
  onAdd,
  onEdit,
  onRemove,
}: ItemsSectionProps) {
  return (
    <View className="gap-3">
      <AppText variant="title" role="heading">
        Items
      </AppText>
      {error ? <Alert tone="danger" message={error} /> : null}
      {items.length === 0 ? (
        <View className="items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="pencil" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No items yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each image or video you need and how many.
            </AppText>
          </View>
        </View>
      ) : (
        items.map((row) => {
          const name = itemName(row);
          const incomplete = attempted && Object.keys(validateItem(row)).length > 0;
          const files = fileCount(row);
          return (
            <View key={row.id} className="gap-1 rounded-xl border border-border bg-surface p-4">
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
                {`${row.qty || 0} pcs${files > 0 ? ` · ${files} ${files === 1 ? 'reference' : 'references'}` : ''}`}
              </AppText>
              {incomplete ? (
                <AppText variant="caption" tone="danger" aria-live="polite">
                  This item is not complete. Tap edit to finish it.
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
    </View>
  );
}
