import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button, ListGroup, ListRow, TextField } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import {
  groupThousands,
  parseAmount,
  sanitizeAmount,
  sanitizeMoney,
} from '../../create/calculate-line';
import { itemAmounts, validateItem } from '../../create/draft';
import { useManagerOptions, useProductOptions } from '../../hooks/use-lookups';
import type { DiscountKind, DraftItem, ManagerOption, ProductOption } from '../../types';
import { ChoiceField } from './choice-field';
import { LookupField } from './lookup-field';

const DISCOUNTS: readonly { value: DiscountKind; label: string }[] = [
  { value: 'none', label: 'No discount' },
  { value: 'percent', label: 'Percentage' },
  { value: 'nominal', label: 'Nominal' },
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
  const { priceAfterDiscount, amount } = itemAmounts(item);
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
          <LookupField<ProductOption>
            label="Product"
            required
            placeholder="Find a product"
            sheetTitle="Choose product"
            value={item.product}
            onChange={(product) =>
              patch({
                product,
                manager: null,
                unitPrice: product.price
                  ? String(parseAmount(String(product.price)))
                  : item.unitPrice,
              })
            }
            useOptions={useProductOptions}
            getKey={(product) => product.sku_no}
            getTitle={(product) => product.product_name ?? product.product_code ?? product.sku_no}
            getCaption={(product) => product.sku_no}
            help={item.product?.pm ? `Product manager: ${item.product.pm}` : undefined}
            error={errors.product}
          />
          {item.product && !item.product.pm ? (
            <LookupField<ManagerOption>
              label="Product manager"
              required
              placeholder="Find a product manager"
              sheetTitle="Choose product manager"
              value={item.manager}
              onChange={(manager) => patch({ manager })}
              useOptions={useManagerOptions}
              getKey={(manager) => manager.email}
              getTitle={(manager) => manager.name ?? manager.email}
              getCaption={(manager) => manager.email}
              help="This category has no product manager yet. Choose one."
              error={errors.manager}
            />
          ) : null}
          <TextField
            label="Remarks"
            value={item.remark}
            onChangeText={(remark) => patch({ remark })}
          />
          <TextField
            label="Quantity"
            required
            keyboardType="decimal-pad"
            value={item.qty}
            onChangeText={(qty) => patch({ qty: sanitizeAmount(qty) })}
            error={errors.qty}
          />
          <TextField
            label="Unit price (Rp, including VAT)"
            required
            keyboardType="decimal-pad"
            value={groupThousands(item.unitPrice)}
            onChangeText={(unitPrice) => patch({ unitPrice: sanitizeMoney(unitPrice) })}
            error={errors.unitPrice}
          />
          <ChoiceField
            label="Discount type"
            options={DISCOUNTS}
            value={item.discountKind}
            onChange={(discountKind) => patch({ discountKind, discountValue: '' })}
          />
          {item.discountKind !== 'none' ? (
            <TextField
              required
              label={item.discountKind === 'percent' ? 'Discount (%)' : 'Discount amount (Rp)'}
              keyboardType="decimal-pad"
              value={
                item.discountKind === 'nominal'
                  ? groupThousands(item.discountValue)
                  : item.discountValue
              }
              onChangeText={(discountValue) =>
                patch({
                  discountValue:
                    item.discountKind === 'nominal'
                      ? sanitizeMoney(discountValue)
                      : sanitizeAmount(discountValue),
                })
              }
              trailing={
                item.discountKind === 'percent' ? <AppText tone="muted">%</AppText> : undefined
              }
              error={errors.discountValue}
            />
          ) : null}
          <TextField
            label="Cash discount (%)"
            required
            keyboardType="decimal-pad"
            value={item.cashDiscount}
            onChangeText={(cashDiscount) => patch({ cashDiscount: sanitizeAmount(cashDiscount) })}
            trailing={<AppText tone="muted">%</AppText>}
            error={errors.cashDiscount}
          />
        </View>

        <ListGroup>
          <ListRow label="Price after discount" value={formatMoney(priceAfterDiscount)} />
          <ListRow label="Amount" value={formatMoney(amount)} />
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
