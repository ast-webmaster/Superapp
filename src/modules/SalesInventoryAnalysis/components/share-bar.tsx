import { View } from 'react-native';

export interface ShareBarProps {
  /** How much is reached, 0 to 100 and beyond; the bar stops at full. */
  percentage: number;
  /** Where the bar should be by now (0 to 100), drawn as a tick. */
  marker?: number;
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

/**
 * A soft bar of how much is reached, with an optional tick for where it should be. Decorative:
 * the card beside it states both numbers in text, so screen readers skip it.
 */
export function ShareBar({ percentage, marker }: ShareBarProps) {
  return (
    <View aria-hidden className="h-4 justify-center">
      <View className="h-2 overflow-hidden rounded-pill bg-primary-soft">
        <View
          style={{ width: `${clamp(percentage)}%` }}
          className="h-full rounded-pill bg-primary"
        />
      </View>
      {marker === undefined ? null : (
        <View
          style={{ left: `${clamp(marker)}%` }}
          className="absolute h-4 w-0.5 rounded-pill bg-accent"
        />
      )}
    </View>
  );
}
