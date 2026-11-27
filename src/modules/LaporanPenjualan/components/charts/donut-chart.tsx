import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';

import { formatShare, placeSlices, polar, sectorPath, spreadLabels, type Slice } from './donut';
import { Reveal } from './reveal';

const HEIGHT = 224;
/** The column each side keeps for its labels. */
const LABEL_WIDTH = 68;
/** How far a label sits out from the ring, which decides its height. */
const LABEL_REACH = 28;
/** A percentage over a name. */
const LABEL_HEIGHT = 36;
const MAX_RADIUS = 84;
/** The ring is this share of the radius thick. */
const THICKNESS = 0.34;
const CORNER = 5;
const GAP = 4;

/**
 * Parts of a whole as a ring of rounded slices, each with its percentage and name beside it, joined
 * by a line of its own color. `label` and the slices are read out as one sentence by screen readers.
 */
export function DonutChart({ slices, label }: { slices: Slice[]; label: string }) {
  const [width, setWidth] = useState(0);

  const cx = width / 2;
  const cy = HEIGHT / 2;
  const radius = Math.max(Math.min(width / 2 - LABEL_WIDTH - 14, MAX_RADIUS), 0);
  const parts = placeSlices(slices).map((part) => ({
    ...part,
    start: polar(cx, cy, radius + 3, part.anchor),
    bend: polar(cx, cy, radius + 10, part.anchor),
    wanted: polar(cx, cy, radius + LABEL_REACH, part.anchor).y,
  }));

  const labelY = new Map<string, number>();
  for (const right of [true, false]) {
    const side = parts.filter((part) => part.right === right);
    spreadLabels(
      side.map((part) => part.wanted),
      LABEL_HEIGHT + 4,
      LABEL_HEIGHT / 2,
      HEIGHT - LABEL_HEIGHT / 2,
    ).forEach((y, index) => labelY.set(side[index]!.slice.key, y));
  }

  return (
    <View
      accessible
      role="img"
      aria-label={`${label}. ${slices
        .map((slice) => `${slice.label} ${formatShare(slice.percentage)}`)
        .join('; ')}`}>
      <Reveal>
        <View
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={{ height: HEIGHT }}>
          {width > 0 ? (
            <>
              <Svg width={width} height={HEIGHT}>
                {parts.map(({ slice, start, bend, right }) => {
                  const end = right ? width - LABEL_WIDTH - 2 : LABEL_WIDTH + 2;
                  const y = labelY.get(slice.key);
                  return (
                    <Path
                      key={`line-${slice.key}`}
                      d={`M ${start.x} ${start.y} L ${bend.x} ${bend.y} L ${
                        right ? end - 6 : end + 6
                      } ${y} L ${end} ${y}`}
                      stroke={colors[slice.color]}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      fill="none"
                    />
                  );
                })}
                {parts.map(({ slice, from, to }) => (
                  <Path
                    key={slice.key}
                    d={sectorPath({
                      cx,
                      cy,
                      outer: radius,
                      inner: radius * (1 - THICKNESS),
                      from,
                      to,
                      corner: CORNER,
                      // One slice is a whole ring: nothing to separate it from.
                      gap: slices.length > 1 ? GAP : 0,
                    })}
                    fill={colors[slice.color]}
                    stroke={colors[slice.color]}
                    strokeWidth={CORNER * 2}
                    strokeLinejoin="round"
                  />
                ))}
                {parts.map(({ slice, start }) => (
                  <Circle
                    key={`dot-${slice.key}`}
                    cx={start.x}
                    cy={start.y}
                    r={3}
                    fill={colors[slice.color]}
                  />
                ))}
              </Svg>
              {parts.map(({ slice, right }) => (
                <View
                  key={slice.key}
                  className={right ? 'absolute right-0 items-end' : 'absolute left-0 items-start'}
                  style={{ top: labelY.get(slice.key)! - LABEL_HEIGHT / 2, width: LABEL_WIDTH }}>
                  <AppText variant="caption-strong">{formatShare(slice.percentage)}</AppText>
                  <AppText variant="label" tone="muted" numberOfLines={1}>
                    {slice.label}
                  </AppText>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </Reveal>
    </View>
  );
}
