import { View } from 'react-native';

import { AppText, Button } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { daysInRange } from '../../create/dates';
import { hasChangedDates } from '../../create/declaration-draft';
import type { DeclarationDestinationDraft } from '../../types';
import { DateRangeField } from '../create/date-range-field';

export interface DeclarationDestinationCardProps {
  row: DeclarationDestinationDraft;
  error?: string;
  onChange: (patch: Partial<DeclarationDestinationDraft>) => void;
}

/** One destination of the declaration. The days stay as planned unless the user changes them. */
export function DeclarationDestinationCard({
  row,
  error,
  onChange,
}: DeclarationDestinationCardProps) {
  const changed = hasChangedDates(row);
  const days = daysInRange(row.startDate, row.endDate);

  return (
    <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
      <View className="gap-1">
        <AppText variant="module-title">{row.destination}</AppText>
        <AppText variant="caption" tone="muted">
          {`Planned ${formatDate(row.originalStart)} - ${formatDate(row.originalEnd)}`}
        </AppText>
      </View>
      <DateRangeField
        label="Actual days"
        start={row.startDate}
        end={row.endDate}
        onChange={({ start, end }) => onChange({ startDate: start, endDate: end })}
        error={error}
        help={
          changed
            ? `${days} ${days === 1 ? 'day' : 'days'}. The allowance is worked out again from these days.`
            : 'Change the days only if the trip was different from the plan.'
        }
      />
      {changed ? (
        <Button
          variant="soft"
          onPress={() => onChange({ startDate: row.originalStart, endDate: row.originalEnd })}>
          Back to planned days
        </Button>
      ) : null}
    </View>
  );
}
