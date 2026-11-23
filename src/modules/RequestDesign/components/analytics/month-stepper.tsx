import { View } from 'react-native';

import { AppText, IconButton } from '@/shared/ui';

import type { AnalyticsPeriod } from '../../types';
import { currentPeriod, isAfter, MIN_YEAR, periodLabel, shiftPeriod } from './period';

export interface MonthStepperProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

/** Steps one month back or forward. It stops at the current month: later ones have nothing yet. */
export function MonthStepper({ value, onChange }: MonthStepperProps) {
  const previous = shiftPeriod(value, -1);
  const next = shiftPeriod(value, 1);

  return (
    <View className="flex-row items-center justify-between px-5 pt-2">
      <IconButton
        size="sm"
        icon="chevron-left"
        label="Previous month"
        disabled={previous.year < MIN_YEAR}
        onPress={() => onChange(previous)}
      />
      <AppText variant="body-strong" role="heading" aria-live="polite">
        {periodLabel(value)}
      </AppText>
      <IconButton
        size="sm"
        icon="chevron-right"
        label="Next month"
        disabled={isAfter(next, currentPeriod())}
        onPress={() => onChange(next)}
      />
    </View>
  );
}
