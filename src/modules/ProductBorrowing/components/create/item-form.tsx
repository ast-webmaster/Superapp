import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button, TextField } from '@/shared/ui';

import { MAX_QTY, MAX_REMARKS, validateItem } from '../../create/draft';
import {
  useMarketingOptions,
  useProductManagerOptions,
  useStockOptions,
} from '../../hooks/use-lookups';
import type { DraftItem, PersonOption, ProductBorrowingOptions, StockOption } from '../../types';
import { ChoiceField } from './choice-field';
import { DateRangeField } from './date-range-field';
import { LookupField } from './lookup-field';

const person = (option: PersonOption) => option.name ?? option.email;

export interface ItemFormProps {
  /** Heading above the fields, such as "New item". */
  title: string;
  initial: DraftItem;
  options: ProductBorrowingOptions;
  /** The document's other items: a product may appear only once. */
  others: readonly DraftItem[];
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}

/** One item, edited on its own copy: nothing reaches the draft until the user saves it. */
export function ItemForm({ title, initial, options, others, onSave, onCancel }: ItemFormProps) {
  const [item, setItem] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateItem(item, others) : {};
  const patch = (changes: Partial<DraftItem>) => setItem((current) => ({ ...current, ...changes }));

  // Stock is per warehouse, so the product list follows the chosen one.
  const useStock = (search: string, enabled: boolean) =>
    useStockOptions(item.warehouse, search, enabled);

  const pickProduct = (product: StockOption) => {
    // The category's product manager is the starting value, when this user may still choose them.
    const suggested = options.product_managers.find(
      ({ email }) => email === product.product_manager,
    );
    patch({ product, productManager: suggested ?? item.productManager });
  };

  const save = () => {
    if (Object.keys(validateItem(item, others)).length > 0) {
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
            label="Warehouse"
            required
            options={options.warehouses.map((value) => ({ value, label: value }))}
            value={item.warehouse}
            onChange={(warehouse) =>
              // Another warehouse has other stock, so the chosen product no longer applies.
              patch(warehouse === item.warehouse ? {} : { warehouse, product: null })
            }
            error={errors.warehouse}
          />
          <LookupField<StockOption>
            label="Product"
            required
            placeholder={item.warehouse ? 'Find a product' : 'Choose a warehouse first'}
            sheetTitle="Choose product"
            value={item.product}
            onChange={pickProduct}
            useOptions={useStock}
            getKey={(product) => product.product_code}
            getTitle={(product) => product.product_name ?? product.product_code}
            getCaption={(product) => `${product.product_code} · ${product.available} available`}
            help={
              item.product?.available != null
                ? `${item.product.available} available in ${item.warehouse}`
                : undefined
            }
            error={errors.product}
            disabled={!item.warehouse}
          />
          <TextField
            label="Quantity"
            required
            keyboardType="number-pad"
            maxLength={String(MAX_QTY).length}
            value={item.qty}
            onChangeText={(qty) => patch({ qty: qty.replace(/\D/g, '') })}
            error={errors.qty}
          />
          <DateRangeField
            label="Borrow period"
            required
            start={item.startDate}
            end={item.endDate}
            onChange={({ start, end }) => patch({ startDate: start, endDate: end })}
            error={errors.period}
          />
          <LookupField<PersonOption>
            label="Product manager"
            required
            placeholder="Find a product manager"
            sheetTitle="Choose product manager"
            value={item.productManager}
            onChange={(productManager) => patch({ productManager })}
            useOptions={useProductManagerOptions}
            getKey={(manager) => manager.email}
            getTitle={person}
            getCaption={(manager) => (manager.name ? manager.email : null)}
            help="Approves this item."
            error={errors.productManager}
          />
          <LookupField<PersonOption>
            label="Processed by"
            required
            placeholder="Find marketing staff"
            sheetTitle="Choose marketing"
            value={item.marketing}
            onChange={(marketing) => patch({ marketing })}
            useOptions={useMarketingOptions}
            getKey={(marketing) => marketing.email}
            getTitle={person}
            getCaption={(marketing) => (marketing.name ? marketing.email : null)}
            help="Hands the item out and receives it back."
            error={errors.marketing}
          />
          <TextField
            label="Remarks"
            multiline
            maxLength={MAX_REMARKS}
            value={item.remarks}
            onChangeText={(remarks) => patch({ remarks })}
            error={errors.remarks}
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
