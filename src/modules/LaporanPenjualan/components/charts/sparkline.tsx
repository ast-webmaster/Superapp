import { useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, type ColorToken } from '@/shared/theme/tokens';

import { Reveal } from './reveal';
import { smoothArea, smoothLine } from './smooth-path';

/** Room so the stroke and the end dot are not clipped at the edges. */
const PAD_X = 4;
const PAD_Y = 6;

export interface SparklineProps {
  /** Oldest first. The line runs from the lowest value (or zero) to the highest. */
  values: number[];
  color: ColorToken;
  height: number;
  /** A fixed width; without it the sparkline fills the width it is given. */
  width?: number;
}

/**
 * A small trend line with a soft fill under it and a dot on the latest value, like a price
 * ticker. Decorative: the amount beside it is the information, so screen readers skip it.
 */
export function Sparkline({ values, color, height, width: fixedWidth }: SparklineProps) {
  const [measured, setMeasured] = useState(0);
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const width = fixedWidth ?? measured;
  const stroke = colors[color];

  const min = Math.min(0, ...values);
  const max = Math.max(...values, 1);
  const span = max - min || 1;
  const last = values.length - 1;
  const x = (index: number) => PAD_X + (index / last) * (width - PAD_X * 2);
  const y = (value: number) => PAD_Y + (1 - (value - min) / span) * (height - PAD_Y * 2);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const end = points[last];

  return (
    <View
      aria-hidden
      pointerEvents="none"
      onLayout={fixedWidth ? undefined : (event) => setMeasured(event.nativeEvent.layout.width)}
      style={{ height, width: fixedWidth }}>
      {width > 0 && last >= 1 && end ? (
        <Reveal trigger={values.length}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stroke} stopOpacity={0.32} />
                <Stop offset="1" stopColor={stroke} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d={smoothArea(points, height - PAD_Y)} fill={`url(#${gradientId})`} />
            <Path
              d={smoothLine(points)}
              stroke={stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx={end.x} cy={end.y} r={6} fill={stroke} fillOpacity={0.24} />
            <Circle cx={end.x} cy={end.y} r={3} fill={stroke} />
          </Svg>
        </Reveal>
      ) : null}
    </View>
  );
}
