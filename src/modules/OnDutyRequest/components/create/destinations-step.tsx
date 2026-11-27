import { View } from 'react-native';

import { Alert, AppText, Button, Icon, IconButton } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { destinationDays, MAX_ROWS, type Errors } from '../../create/draft';
import type { DraftDestination } from '../../types';

/** "24 Nov 2026 - 25 Nov 2026 · 2 days", the line under a destination's name. */
export function destinationSummary(row: DraftDestination): string {
  const days = destinationDays(row);
  return `${row.startDate ? formatDate(row.startDate) : '-'} - ${row.endDate ? formatDate(row.endDate) : '-'} · ${days} ${days === 1 ? 'day' : 'days'}`;
}

export interface DestinationsStepProps {
  destinations: DraftDestination[];
  /** Allowance per day, or null when the account has none for this trip type. */
  rate: number | null;
  errors: Errors;
  onAdd: () => void;
  onEdit: (row: DraftDestination) => void;
  onRemove: (row: DraftDestination) => void;
}

export function DestinationsStep({
  destinations,
  rate,
  errors,
  onAdd,
  onEdit,
  onRemove,
}: DestinationsStepProps) {
  return (
    <>
      {errors.destinations ? <Alert tone="danger" message={errors.destinations} /> : null}
      {rate !== null ? (
        <AppText variant="caption" tone="muted">
          {`Your daily allowance is ${formatMoney(rate)}. The server counts the first and the last day.`}
        </AppText>
      ) : null}
      {destinations.length === 0 ? (
        <View className="items-center gap-4 rounded-xl shadow-card bg-surface p-5">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="map" color="primary" />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title" className="text-center">
              No destinations yet
            </AppText>
            <AppText tone="muted" className="text-center">
              Add each place you go and the days you are there.
            </AppText>
          </View>
        </View>
      ) : (
        destinations.map((row) => {
          const name = row.destination ?? 'Destination';
          return (
            <View key={row.id} className="gap-2 rounded-xl shadow-card bg-surface p-4">
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
                {destinationSummary(row)}
              </AppText>
              {rate !== null ? (
                <View className="flex-row items-center justify-between gap-3 border-t border-border pt-3">
                  <AppText variant="caption" tone="muted">
                    Allowance (estimate)
                  </AppText>
                  <AppText variant="body-strong">
                    {formatMoney(destinationDays(row) * rate)}
                  </AppText>
                </View>
              ) : null}
            </View>
          );
        })
      )}
      <Button
        variant="soft"
        block
        iconLeft="plus"
        disabled={destinations.length >= MAX_ROWS}
        onPress={onAdd}>
        Add destination
      </Button>
    </>
  );
}
