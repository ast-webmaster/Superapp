import { clsx } from 'clsx';
import { View } from 'react-native';

import { AppText } from '@/shared/ui';

import { STEPS } from '../../create/draft';

export interface StepIndicatorProps {
  /** Zero-based index into `STEPS`. */
  current: number;
}

/** The step name and "Step n of 4" above one bar per step. Steps are reached with Back and Next. */
export function StepIndicator({ current }: StepIndicatorProps) {
  const label = `Step ${current + 1} of ${STEPS.length}`;

  return (
    <View
      accessible
      aria-label={`${label}: ${STEPS[current]?.title}`}
      className="gap-2 px-5 pb-2 pt-2">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="title" role="heading">
          {STEPS[current]?.title ?? ''}
        </AppText>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
      </View>
      <View className="flex-row gap-2">
        {STEPS.map((step, index) => (
          <View
            key={step.key}
            className={clsx(
              'h-1 flex-1 rounded-pill',
              index <= current ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </View>
    </View>
  );
}
