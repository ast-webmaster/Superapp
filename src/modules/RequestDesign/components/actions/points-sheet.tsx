import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, Loading, Sheet, TextField } from '@/shared/ui';

import { MAX_QTY } from '../../create/draft';
import { countedQty, OPTIONAL_CATEGORY, pointsProblem, type Quantities } from '../../create/points';
import { useRequestDesignOptions } from '../../hooks/use-options';
import type { RequestDesignDetail } from '../../types';
import { failureOutcome } from '../write-outcome';
import type { ActionSheetProps } from './due-date-sheet';

const quantityOf = (value: string | undefined) => Number(value || 0);

const initialValues = (detail: RequestDesignDetail): Quantities =>
  Object.fromEntries(
    (detail.points?.categories ?? []).filter((c) => c.qty > 0).map((c) => [c.uuid, String(c.qty)]),
  );

/**
 * The designer says how many pieces fall in each point category. It replaces the whole breakdown,
 * and a category left empty counts as 0.
 */
export function PointsSheet({ detail, online, action, onClose }: ActionSheetProps) {
  const options = useRequestDesignOptions();
  const [values, setValues] = useState<Quantities>(() => initialValues(detail));
  const [attempted, setAttempted] = useState(false);

  const categories = options.data?.point_categories ?? [];
  const problem = pointsProblem(categories, values, detail.total_qty);
  const counted = countedQty(categories, values);

  const submit = () => {
    if (action.isPending || categories.length === 0) return;
    if (problem) {
      setAttempted(true);
      return;
    }
    action.mutate(
      {
        action: 'set_points',
        updatedAt: detail.updated_at,
        points: categories.map((category) => ({
          categoryUuid: category.uuid,
          qty: quantityOf(values[category.uuid]),
        })),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      visible
      fullHeight
      title="Set points"
      onClose={onClose}
      footer={
        <Button
          block
          loading={action.isPending}
          disabled={!online || categories.length === 0}
          onPress={submit}>
          Save points
        </Button>
      }>
      {options.data === undefined ? (
        options.error ? (
          <>
            <Alert tone="danger" message={toAppError(options.error).message} />
            <Button variant="soft" onPress={() => void options.refetch()}>
              Try again
            </Button>
          </>
        ) : (
          <Loading label="Loading point categories" />
        )
      ) : (
        <View className="gap-4">
          <AppText variant="caption" tone="muted">
            {`${counted} of ${detail.total_qty} pieces counted. The ${OPTIONAL_CATEGORY.toLowerCase()} category is not counted.`}
          </AppText>
          {categories.map((category) => (
            <TextField
              key={category.uuid}
              label={category.name}
              help={`${category.point} point each`}
              keyboardType="number-pad"
              maxLength={String(MAX_QTY).length}
              value={values[category.uuid] ?? ''}
              onChangeText={(text) =>
                setValues((current) => ({ ...current, [category.uuid]: text.replace(/\D/g, '') }))
              }
            />
          ))}
          {attempted && problem ? (
            <AppText variant="caption" tone="danger" aria-live="polite">
              {problem}
            </AppText>
          ) : null}
        </View>
      )}
      {action.error ? <Alert {...failureOutcome(action.error)} /> : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to save points.
        </AppText>
      ) : null}
    </Sheet>
  );
}
