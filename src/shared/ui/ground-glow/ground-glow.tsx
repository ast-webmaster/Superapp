import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';

/**
 * The peach glow in the top-right corner of the window, drawn behind whatever holds it. The
 * navigator draws its header apart from `Screen`, so each of them renders this and it measures
 * where it sits in the window: both then show their own slice of the same gradient and the header
 * needs no background of its own. Fill the parent with it, under the content.
 */
export function GroundGlow() {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [offset, setOffset] = useState(0);

  return (
    <View
      ref={ref}
      pointerEvents="none"
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      onLayout={() => ref.current?.measureInWindow((_x, y) => setOffset(y))}>
      <View className="absolute inset-x-0 h-104" style={{ top: -offset }}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="ground-glow" cx="100%" cy="0%" rx="90%" ry="100%" fx="100%" fy="0%">
              <Stop offset="0" stopColor={colors['ground-glow']} stopOpacity={1} />
              <Stop offset="1" stopColor={colors['ground-glow']} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ground-glow)" />
        </Svg>
      </View>
    </View>
  );
}
