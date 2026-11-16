import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button, ListGroup, ListRow, TextField } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { groupThousands, sanitizeInteger, sanitizeMoney } from '../../create/amount';
import { itemAmount, needsDocument, validateItem } from '../../create/draft';
import { useItemOptions } from '../../hooks/use-lookups';
import type { DraftItem, ItemCategory, ItemOption, ItemSource } from '../../types';
import { ChoiceField } from './choice-field';
import { DateField } from './date-field';
import { DocumentField } from './document-field';
import { LookupField } from './lookup-field';

const SOURCES: readonly { value: ItemSource; label: string }[] = [
  { value: 'registered', label: 'Registered item' },
  { value: 'new', label: 'New item' },
];

const CATEGORIES: readonly { value: ItemCategory; label: string }[] = [
  { value: 'TRADE', label: 'Trade' },
  { value: 'FIXED ASSET', label: 'Fixed asset' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHERS', label: 'Others' },
];

export interface ItemFormProps {
  /** Heading above the fields, such as "New item". */
  title: string;
  initial: DraftItem;
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}

/** One item, edited on its own copy: nothing reaches the draft until the user saves it. */
export function ItemForm({ title, initial, onSave, onCancel }: ItemFormProps) {
  const [item, setItem] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateItem(item) : {};
  const patch = (changes: Partial<DraftItem>) => setItem((current) => ({ ...current, ...changes }));

  const save = () => {
    if (Object.keys(validateItem(item)).length > 0) {
      setAttempted(true);
      return;
    }
    onSave(item);
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
          <ChoiceField
            label="Item type"
            options={SOURCES}
            value={item.source}
            onChange={(source) => patch({ source })}
          />
          {item.source === 'registered' ? (
            <LookupField<ItemOption>
              label="Item"
              required
              placeholder="Find an item"
              sheetTitle="Choose item"
              value={item.item}
              onChange={(chosen) =>
                patch({
                  item: chosen,
                  // The last price is a sensible start; the user can still change it.
                  unitPrice:
                    chosen.last_price > 0 && item.unitPrice === ''
                      ? String(chosen.last_price)
                      : item.unitPrice,
                })
              }
              useOptions={useItemOptions}
              getKey={(option) => option.item_code}
              getTitle={(option) => option.item_description ?? option.item_no ?? option.item_code}
              getCaption={(option) => option.item_no}
              error={errors.item}
            />
          ) : (
            <TextField
              label="Item name"
              required
              value={item.newName}
              onChangeText={(newName) => patch({ newName })}
              maxLength={191}
              error={errors.newName}
              help="Purchasing reviews a new item before it joins the list."
            />
          )}
          <ChoiceField
            label="Category"
            required
            options={CATEGORIES}
            value={item.category}
            onChange={(category) => patch({ category })}
            error={errors.category}
          />
          <TextField
            label="Quantity"
            required
            keyboardType="number-pad"
            value={item.qty}
            onChangeText={(qty) => patch({ qty: sanitizeInteger(qty) })}
            error={errors.qty}
          />
          <TextField
            label="Unit price (Rp)"
            required
            keyboardType="decimal-pad"
            value={groupThousands(item.unitPrice)}
            onChangeText={(unitPrice) => patch({ unitPrice: sanitizeMoney(unitPrice) })}
            error={errors.unitPrice}
          />
          <TextField
            label="Stock on hand"
            keyboardType="number-pad"
            value={item.stockOnHand}
            onChangeText={(stockOnHand) => patch({ stockOnHand: sanitizeInteger(stockOnHand) })}
          />
          <DateField
            label="Needed by"
            clearable
            value={item.dueDate}
            onChange={(dueDate) => patch({ dueDate })}
          />
          <TextField
            label="Remarks"
            value={item.remarks}
            onChangeText={(remarks) => patch({ remarks })}
            multiline
            textAlignVertical="top"
            className="min-h-20"
          />
          <DocumentField
            required={needsDocument(item)}
            value={item.document}
            onChange={(document) => patch({ document })}
            error={errors.document}
          />
        </View>

        <ListGroup>
          <ListRow label="Amount" value={formatMoney(itemAmount(item))} />
        </ListGroup>
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
