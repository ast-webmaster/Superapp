import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/shared/theme/tokens';

/** The pale blue glow in the top-right corner of the Home ground. Fill the parent with it, under the content. */
export function GroundGlow() {
  return (
    <View pointerEvents="none" aria-hidden className="absolute inset-x-0 top-0 h-104">
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
  );
}
