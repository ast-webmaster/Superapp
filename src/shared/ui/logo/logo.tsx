import { Image } from 'expo-image';
import { View } from 'react-native';

const sources = {
  dark: require('@/assets/brand/astrindo-logo.png'),
  light: require('@/assets/brand/astrindo-logo-white.png'),
} as const;

const ASPECT_RATIO = 4000 / 888;
const MIN_WIDTH = 64;

export interface LogoProps {
  /** `dark` is the black logo for light grounds; `light` is the white one for `primary` grounds. */
  variant?: keyof typeof sources;
  /** Rendered width in px. The brand minimum of 64 is always enforced. */
  width?: number;
  className?: string;
}

export function Logo({ variant = 'dark', width = 160, className }: LogoProps) {
  const safeWidth = Math.max(width, MIN_WIDTH);

  return (
    <View className={className}>
      <Image
        alt="Astrindo"
        contentFit="contain"
        source={sources[variant]}
        style={{ width: safeWidth, height: safeWidth / ASPECT_RATIO }}
      />
    </View>
  );
}
