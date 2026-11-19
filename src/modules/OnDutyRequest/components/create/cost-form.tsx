import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActionBar, AppText, Button, TextField } from '@/shared/ui';

import { groupThousands, sanitizeMoney } from '../../create/amount';
import { isVoucher, validateCost } from '../../create/draft';
import { useCostItemOptions } from '../../hooks/use-lookups';
import type { CostItemOption, DraftCost } from '../../types';
import { ChoiceField } from './choice-field';
import { LookupField } from './lookup-field';

const SHARING = [
  { value: 'NO', label: 'No' },
  { value: 'YES', label: 'Yes' },
] as const;

/** What the way a cost is paid means for the person filling it in. */
const NEED_PR_HELP: Record<string, string> = {
  PR: 'When the Director approves, this cost becomes a purchase request.',
  'NO-PR': 'You pay this yourself and report the real amount in the declaration.',
  VOUCHER: 'HRGA hands out vouchers, so the amount is always Rp 0.',
};

export interface CostFormProps {
  /** Heading above the fields, such as "New cost". */
  title: string;
  initial: DraftCost;
  /** Whether the request splits its cost between brands, which a cost may then be part of. */
  canShare: boolean;
  onSave: (cost: DraftCost) => void;
  onCancel: () => void;
}

/** One cost row, edited on its own copy: nothing reaches the draft until the user saves it. */
export function CostForm({ title, initial, canShare, onSave, onCancel }: CostFormProps) {
  const [cost, setCost] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateCost(cost) : {};
  const patch = (changes: Partial<DraftCost>) => setCost((current) => ({ ...current, ...changes }));
  const voucher = isVoucher(cost);

  const save = () => {
    if (Object.keys(validateCost(cost)).length > 0) {
      setAttempted(true);
      return;
    }
    onSave(cost);
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
          <LookupField<CostItemOption>
            label="Expense"
            required
            placeholder="Choose an expense"
            sheetTitle="Choose expense"
            value={cost.item}
            onChange={(item) =>
              patch({ item, amount: item.need_pr === 'VOUCHER' ? '0' : cost.amount })
            }
            useOptions={useCostItemOptions}
            getKey={(option) => option.item_code}
            getTitle={(option) => option.item_description ?? option.item_code}
            getCaption={(option) => option.item_code}
            error={errors.item}
          />
          <TextField
            label="Estimated amount (Rp)"
            required={!voucher}
            keyboardType="decimal-pad"
            editable={!voucher}
            value={voucher ? '0' : groupThousands(cost.amount)}
            onChangeText={(amount) => patch({ amount: sanitizeMoney(amount) })}
            error={errors.amount}
            help={cost.item?.need_pr ? NEED_PR_HELP[cost.item.need_pr] : undefined}
          />
          {canShare ? (
            <ChoiceField
              label="Shared between brands"
              options={SHARING}
              value={cost.sharing ? 'YES' : 'NO'}
              onChange={(value) => patch({ sharing: value === 'YES' })}
            />
          ) : null}
          <TextField
            label="Remarks"
            value={cost.remarks}
            onChangeText={(remarks) => patch({ remarks })}
            multiline
            textAlignVertical="top"
            className="min-h-20"
          />
        </View>
      </ScrollView>
      <ActionBar>
        <View className="flex-row gap-2">
          <Button block variant="secondary" className="flex-1 px-2" onPress={onCancel}>
            Cancel
          </Button>
          <Button block className="flex-2" onPress={save}>
            Save cost
          </Button>
        </View>
      </ActionBar>
    </>
  );
}
