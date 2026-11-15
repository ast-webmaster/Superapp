import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';

import { formatPercent } from '../level';

const SIZE = 104;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The share of the target reached, as a soft ring with the percentage in the middle. */
export function ProgressRing({ percentage }: { percentage: number }) {
  const fill = Math.min(Math.max(percentage, 0), 100);

  return (
    <View
      accessible
      role="progressbar"
      aria-label={`${formatPercent(percentage)} of target`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(fill)}
      className="items-center justify-center">
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors['primary-soft']}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* A round cap on an empty arc would still draw a dot, so 0% draws no arc. */}
        {fill > 0 ? (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - fill / 100)}
            fill="none"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        ) : null}
      </Svg>
      <View className="absolute items-center">
        <AppText variant="title">{formatPercent(percentage)}</AppText>
        <AppText variant="label" tone="muted">
          of target
        </AppText>
      </View>
    </View>
  );
}
