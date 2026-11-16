import { useId, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';
import {
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatShortDate,
} from '@/shared/utils/format';

import type { DailyAmount } from '../../types';
import { gridTicks } from './scale';
import { smoothArea, smoothLine } from './smooth-path';
import { Reveal } from './reveal';

const HEIGHT = 168;
/** Room above the top gridline for its label. */
const PLOT_TOP = 20;
const PLOT_BOTTOM = 8;
/** Keeps the end dot and its ring inside the drawing. */
const PAD_X = 6;
const TICK_LABEL_OFFSET = 18;

export interface AreaChartProps {
  data: DailyAmount[];
  /** The daily target, drawn as a dashed reference line. */
  target?: number;
  /** Read out by screen readers, such as "Daily sales". */
  label: string;
}

/**
 * Sales per day as one smooth line over a soft fading fill. Touch or drag across it to read a
 * day; the readout above shows the latest day until then. Screen readers move day by day with
 * the adjust gestures.
 */
export function AreaChart({ data, target, label }: AreaChartProps) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const gradientId = `area-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const last = data.length - 1;
  const selected = Math.min(picked ?? last, last);
  const point = data[selected];
  if (!point) return null;

  const ticks = gridTicks(Math.max(...data.map((day) => day.amount), target ?? 0));
  const top = ticks[2];
  const plotHeight = HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const step = last > 0 ? (width - PAD_X * 2) / last : 0;
  const x = (index: number) => (last > 0 ? PAD_X + index * step : width / 2);
  const y = (value: number) => PLOT_TOP + (1 - Math.max(value, 0) / top) * plotHeight;
  const points = data.map((day, index) => ({ x: x(index), y: y(day.amount) }));
  const baseline = y(0);

  const pick = (event: GestureResponderEvent) => {
    if (last <= 0 || step <= 0) return;
    const index = Math.round((event.nativeEvent.locationX - PAD_X) / step);
    setPicked(Math.min(Math.max(index, 0), last));
  };

  return (
    <View className="gap-3">
      <View aria-live="polite" className="gap-1">
        <AppText variant="label" tone="muted">
          {formatDate(point.date)}
        </AppText>
        <AppText variant="title">{formatMoney(point.amount)}</AppText>
      </View>
      <Reveal>
        <View
          accessible
          accessibilityRole="adjustable"
          aria-label={label}
          accessibilityValue={{ text: `${formatDate(point.date)}, ${formatMoney(point.amount)}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={({ nativeEvent }) =>
            setPicked(
              Math.min(
                Math.max(selected + (nativeEvent.actionName === 'increment' ? 1 : -1), 0),
                last,
              ),
            )
          }
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          // A vertical drag still scrolls the screen.
          onResponderTerminationRequest={() => true}
          onResponderGrant={pick}
          onResponderMove={pick}
          style={{ height: HEIGHT }}>
          {width > 0 ? (
            // Children ignore touches, so `locationX` is always measured from this chart's edge.
            <View className="pointer-events-none absolute inset-0">
              <Svg width={width} height={HEIGHT}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.lavender} stopOpacity={0.55} />
                    <Stop offset="1" stopColor={colors.lavender} stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                {ticks.map((tick) => (
                  <Line
                    key={tick}
                    x1={0}
                    x2={width}
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                ))}
                {target ? (
                  <Line
                    x1={0}
                    x2={width}
                    y1={y(target)}
                    y2={y(target)}
                    stroke={colors['ink-muted']}
                    strokeOpacity={0.6}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                ) : null}
                <Path d={smoothArea(points, baseline)} fill={`url(#${gradientId})`} />
                <Path
                  d={smoothLine(points)}
                  stroke={colors.primary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <Line
                  x1={x(selected)}
                  x2={x(selected)}
                  y1={PLOT_TOP}
                  y2={baseline}
                  stroke={colors.lavender}
                  strokeWidth={1}
                />
                <Circle
                  cx={x(selected)}
                  cy={y(point.amount)}
                  r={5}
                  fill={colors.primary}
                  stroke={colors.surface}
                  strokeWidth={2}
                />
              </Svg>
              {ticks.slice(1).map((tick) => (
                <View
                  key={tick}
                  className="absolute left-0"
                  style={{ top: y(tick) - TICK_LABEL_OFFSET }}>
                  <AppText variant="label" tone="muted">
                    {formatCompactMoney(tick)}
                  </AppText>
                </View>
              ))}
              {target ? (
                <View className="absolute right-0" style={{ top: y(target) - TICK_LABEL_OFFSET }}>
                  <AppText variant="label" tone="muted">
                    Daily target
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </Reveal>
      <View aria-hidden className="flex-row justify-between">
        <AppText variant="label" tone="muted">
          {formatShortDate(data[0]!.date)}
        </AppText>
        {last > 0 ? (
          <AppText variant="label" tone="muted">
            {formatShortDate(data[last]!.date)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
