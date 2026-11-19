import { View } from 'react-native';

import { AppText, TextField } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { groupThousands, sanitizeMoney } from '../../create/amount';
import { costKey } from '../../create/declaration-draft';
import type { Errors } from '../../create/draft';
import type { DeclarationCostDraft } from '../../types';
import { DocumentField } from '../create/document-field';

export interface DeclarationCostCardProps {
  cost: DeclarationCostDraft;
  errors: Errors;
  onChange: (patch: Partial<DeclarationCostDraft>) => void;
}

/** One cost row of the declaration: what was estimated, and the real amount, note and receipt. */
export function DeclarationCostCard({ cost, errors, onChange }: DeclarationCostCardProps) {
  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-1">
        <AppText variant="module-title">{cost.label}</AppText>
        <AppText variant="caption" tone="muted">
          {`Estimate ${formatMoney(cost.estimate)}`}
        </AppText>
      </View>
      <TextField
        label="Actual amount (Rp)"
        required
        keyboardType="decimal-pad"
        value={groupThousands(cost.amountReal)}
        onChangeText={(amountReal) => onChange({ amountReal: sanitizeMoney(amountReal) })}
        error={errors[costKey(cost, 'amount')]}
      />
      <TextField
        label="Remarks"
        value={cost.remarks}
        onChangeText={(remarks) => onChange({ remarks })}
        multiline
        textAlignVertical="top"
        className="min-h-20"
      />
      <DocumentField
        label="Receipt"
        required={!cost.hasStoredReceipt}
        value={cost.receipt}
        onChange={(receipt) => onChange({ receipt })}
        error={errors[costKey(cost, 'receipt')]}
        help={
          cost.hasStoredReceipt
            ? 'A receipt is already saved. Choose a file only to replace it.'
            : undefined
        }
      />
    </View>
  );
}
