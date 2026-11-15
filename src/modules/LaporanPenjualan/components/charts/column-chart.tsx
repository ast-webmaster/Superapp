import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';
import { formatCompactMoney, formatMoney } from '@/shared/utils/format';

import { Reveal } from './reveal';
import { niceMax } from './scale';

const HEIGHT = 128;
/** Room above the tallest column for its value. */
const PLOT_TOP = 22;
const MAX_BAR = 24;
const RADIUS = 4;
/** A `label` line (16) plus a 4px gap above the cap. */
const LABEL_HEIGHT = 20;

export type Column = {
  key: string;
  /** Under the column, such as "W-1". */
  label: string;
  value: number;
  /** A second line under the label, such as "12%". */
  note?: string;
};

/** A column with a 4px rounded top and a square foot on the baseline. */
function columnPath(x: number, y: number, width: number, height: number): string {
  const radius = Math.min(RADIUS, width / 2, height);
  return (
    `M${x},${y + height}V${y + radius}Q${x},${y} ${x + radius},${y}` +
    `H${x + width - radius}Q${x + width},${y} ${x + width},${y + radius}V${y + height}Z`
  );
}

export interface ColumnChartProps {
  data: Column[];
  /** The column drawn in the strong color; the rest stay soft. */
  highlight?: string;
  /** Read out by screen readers before the values, such as "Sales per week". */
  label: string;
}

/** Soft rounded columns from one baseline, each with its value on the cap. */
export function ColumnChart({ data, highlight, label }: ColumnChartProps) {
  const [width, setWidth] = useState(0);
  const top = niceMax(Math.max(...data.map((column) => column.value), 0));
  const slot = data.length > 0 ? width / data.length : 0;
  const barWidth = Math.min(MAX_BAR, slot * 0.5);
  const baseline = HEIGHT - 1;
  const height = (value: number) => (Math.max(value, 0) / top) * (baseline - PLOT_TOP);

  return (
    <View
      accessible
      role="img"
      aria-label={`${label}. ${data.map((column) => `${column.label} ${formatMoney(column.value)}`).join(', ')}`}
      className="gap-2">
      <Reveal>
        <View
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={{ height: HEIGHT }}>
          {width > 0 ? (
            <>
              <Svg width={width} height={HEIGHT}>
                <Line
                  x1={0}
                  x2={width}
                  y1={baseline + 0.5}
                  y2={baseline + 0.5}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                {data.map((column, index) =>
                  column.value > 0 ? (
                    <Path
                      key={column.key}
                      d={columnPath(
                        index * slot + (slot - barWidth) / 2,
                        baseline - height(column.value),
                        barWidth,
                        height(column.value),
                      )}
                      fill={column.key === highlight ? colors.primary : colors.lavender}
                    />
                  ) : null,
                )}
              </Svg>
              {/* An empty week (one still to come) gets no value, only its name below. */}
              {data.map((column, index) =>
                column.value > 0 ? (
                  <View
                    key={column.key}
                    className="absolute items-center"
                    style={{
                      left: index * slot,
                      width: slot,
                      top: baseline - height(column.value) - LABEL_HEIGHT,
                    }}>
                    <AppText variant="label" numberOfLines={1}>
                      {formatCompactMoney(column.value)}
                    </AppText>
                  </View>
                ) : null,
              )}
            </>
          ) : null}
        </View>
      </Reveal>
      <View className="flex-row">
        {data.map((column) => (
          <View key={column.key} className="flex-1 items-center">
            <AppText variant="label" tone="muted">
              {column.label}
            </AppText>
            {column.note && column.value > 0 ? (
              <AppText variant="label" tone="muted">
                {column.note}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
