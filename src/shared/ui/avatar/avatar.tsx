import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText, type AppTextProps } from '../text/text';

const sizes = {
  sm: { container: 'size-10', text: 'body-strong' },
  md: { container: 'size-control', text: 'title' },
  xl: { container: 'size-32', text: 'avatar' },
} as const satisfies Record<string, { container: string; text: AppTextProps['variant'] }>;

export interface AvatarProps {
  /** The person's name: the initials when there is no photo, and the accessible name. */
  name: string;
  /** The photo. Leave it out, or pass null, to show the initials. */
  uri?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

/** "Diana Larussa" -> "DL"; one word -> its first letter. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, uri, size = 'md', className }: AvatarProps) {
  const style = sizes[size];

  return (
    <View
      accessible
      role="img"
      aria-label={name}
      className={clsx(
        'items-center justify-center overflow-hidden rounded-pill bg-lavender',
        style.container,
        className,
      )}>
      {uri ? (
        // expo-image takes `style`, not `className`.
        <Image accessible={false} contentFit="cover" source={{ uri }} style={StyleSheet.absoluteFill} />
      ) : (
        <AppText variant={style.text} tone="primary" importantForAccessibility="no">
          {initials(name)}
        </AppText>
      )}
    </View>
  );
}
