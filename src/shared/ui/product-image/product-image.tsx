import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../icon/icon';

const radii = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl' } as const;

export interface ProductImageProps {
  /** Absolute URL of the picture. A missing one shows a placeholder. */
  uri: string | null;
  /** Inside a card: card radius minus card padding. See "Nested corners" in the UI foundation. */
  radius?: keyof typeof radii;
  /** Size, for example `size-16`. */
  className?: string;
}

/** One product picture. The picture is decoration: the name next to it carries the meaning. */
export function ProductImage({ uri, radius = 'lg', className }: ProductImageProps) {
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      className={clsx(
        'items-center justify-center overflow-hidden bg-surface-gray',
        radii[radius],
        className,
      )}>
      {uri ? (
        // expo-image takes `style`, not `className`.
        <Image contentFit="cover" source={{ uri }} style={StyleSheet.absoluteFill} />
      ) : (
        <Icon name="box" color="ink-muted" />
      )}
    </View>
  );
}
