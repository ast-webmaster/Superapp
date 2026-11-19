import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { costAmount, MAX_ROWS, type Errors } from '../../create/draft';
import type { DraftCost } from '../../types';

/** The expense's name as it shows in the lists of the form. */
export const costName = (cost: DraftCost) =>
  cost.item?.item_description ?? cost.item?.item_code ?? '';

export interface CostsStepProps {
  costs: DraftCost[];
  errors: Errors;
  onAdd: () => void;
  onEdit: (cost: DraftCost) => void;
  onRemove: (cost: DraftCost) => void;
}

export function CostsStep({ costs, errors, onAdd, onEdit, onRemove }: CostsStepProps) {
  return (
    <>
      {errors.costs ? <Alert tone="danger" message={errors.costs} /> : null}
      {costs.length === 0 ? (
        <View className="items-center gap-4 rounded-xl border border-border bg-surface p-5">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="wallet" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No costs yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each expense you expect, such as a hotel or a ticket.
            </AppText>
          </View>
        </View>
      ) : (
        costs.map((cost) => {
          const name = costName(cost);
          return (
            <View key={cost.id} className="gap-2 rounded-xl border border-border bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <AppText variant="module-title" className="min-w-0 flex-1 pt-2">
                  {name}
                </AppText>
                <View className="flex-row gap-1">
                  <IconButton
                    size="xs"
                    icon="pencil"
                    label={`Edit ${name}`}
                    onPress={() => onEdit(cost)}
                  />
                  <IconButton
                    size="xs"
                    icon="x"
                    label={`Remove ${name}`}
                    onPress={() => onRemove(cost)}
                  />
                </View>
              </View>
              {cost.sharing || cost.remarks.trim() ? (
                <AppText variant="caption" tone="muted">
                  {[cost.sharing ? 'Shared between brands' : '', cost.remarks.trim()]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              ) : null}
              <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
                <AppText variant="caption" tone="muted">
                  Estimate
                </AppText>
                <AppText variant="module-title">{formatMoney(costAmount(cost))}</AppText>
              </View>
            </View>
          );
        })
      )}
      <Button
        variant="soft"
        block
        iconLeft="plus"
        disabled={costs.length >= MAX_ROWS}
        onPress={onAdd}>
        Add cost
      </Button>
    </>
  );
}
