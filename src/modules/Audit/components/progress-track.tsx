import { View } from 'react-native';

import { AppText } from '@/shared/ui';

export interface ProgressTrackProps {
  label: string;
  /** 0 to 100. */
  percent: number;
}

/** A bar that fills to a known share, with its label and figure. The server sends the percent. */
export function ProgressTrack({ label, percent }: ProgressTrackProps) {
  const value = Math.min(100, Math.max(0, percent));

  return (
    <View
      accessible
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="gap-1">
      <View className="flex-row justify-between gap-3">
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
        <AppText variant="label" tone="muted">{`${value}%`}</AppText>
      </View>
      <View className="h-1.5 overflow-hidden rounded-pill bg-surface-gray">
        {/* A share of the track is a runtime value, so it goes in `style`. */}
        <View className="h-full rounded-pill bg-primary" style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}
