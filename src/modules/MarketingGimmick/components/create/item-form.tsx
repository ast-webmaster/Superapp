import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button, TextField } from '@/shared/ui';

import { MAX_QTY, validateItem } from '../../create/draft';
import type { FlowConfig } from '../../flows';
import { useItemOptions } from '../../hooks/use-lookups';
import type { DraftItem, ItemOption } from '../../types';
import { LookupField } from './lookup-field';

export interface ItemFormProps {
  flow: FlowConfig;
  /** Heading above the fields, such as "New item". */
  title: string;
  initial: DraftItem;
  /** The document's other items: an item may appear only once. */
  others: readonly DraftItem[];
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}

/** One item, edited on its own copy: nothing reaches the draft until the user saves it. */
export function ItemForm({ flow, title, initial, others, onSave, onCancel }: ItemFormProps) {
  const [row, setRow] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateItem(row, others) : {};
  const patch = (changes: Partial<DraftItem>) => setRow((current) => ({ ...current, ...changes }));
  const useItems = (search: string, enabled: boolean) => useItemOptions(flow.flow, search, enabled);

  const save = () => {
    if (Object.keys(validateItem(row, others)).length > 0) {
      setAttempted(true);
      return;
    }
    onSave(row);
  };

  return (
    <>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <View className="gap-4">
          <LookupField<ItemOption>
            label="Item"
            required
            placeholder="Find an item"
            sheetTitle="Choose item"
            value={row.item}
            onChange={(item) => patch({ item })}
            useOptions={useItems}
            getKey={(option) => option.code_item}
            getTitle={(option) => option.name_item ?? option.code_item}
            getCaption={(option) =>
              option.available === null
                ? option.code_item
                : `${option.code_item} · ${option.available} available`
            }
            help={row.item?.available != null ? `${row.item.available} available` : flow.itemsHelp}
            error={errors.item}
          />
          <TextField
            label="Quantity"
            required
            keyboardType="number-pad"
            maxLength={String(MAX_QTY).length}
            value={row.qty}
            onChangeText={(qty) => patch({ qty: qty.replace(/\D/g, '') })}
            error={errors.qty}
          />
        </View>
      </ScrollView>
      <ActionBar>
        <View className="flex-row gap-2">
          <Button block variant="secondary" className="flex-1 px-2" onPress={onCancel}>
            Cancel
          </Button>
          <Button block className="flex-2" onPress={save}>
            Save item
          </Button>
        </View>
      </ActionBar>
    </>
  );
}
