import { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, type ColorToken } from '@/shared/theme/tokens';

import { Reveal } from './reveal';
import { smoothArea, smoothLine } from './smooth-path';

/** Room so the stroke is not clipped at the top and bottom. */
const PAD_Y = 4;

export interface SparklineProps {
  /** Oldest first. The line runs from the lowest value (or zero) to the highest. */
  values: number[];
  color: ColorToken;
  height: number;
}

/**
 * A trend line over a fading fill that runs edge to edge along the bottom of a card, like a price
 * ticker. Decorative: the amount above it is the information, so screen readers skip it.
 */
export function Sparkline({ values, color, height }: SparklineProps) {
  const [width, setWidth] = useState(0);
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const stroke = colors[color];

  const min = Math.min(0, ...values);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const last = values.length - 1;
  const x = (index: number) => (index / last) * width;
  const y = (value: number) => PAD_Y + (1 - (value - min) / span) * (height - PAD_Y * 2);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));

  return (
    <View
      aria-hidden
      pointerEvents="none"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}>
      {width > 0 && last >= 1 ? (
        <Reveal trigger={values.length}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity={0.5} />
                <Stop offset="1" stopColor={stroke} stopOpacity={0.05} />
              </LinearGradient>
            </Defs>
            <Path d={smoothArea(points, height)} fill={`url(#${gradientId})`} />
            <Path
              d={smoothLine(points)}
              stroke={stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Reveal>
      ) : null}
    </View>
  );
}
