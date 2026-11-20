import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '../icon/icon';

export interface ProductImageProps {
  /** Absolute URL of the picture. A missing one shows a placeholder. */
  uri: string | null;
  /** Size and shape, for example `size-16`. */
  className?: string;
}

/** One product picture. The picture is decoration: the name next to it carries the meaning. */
export function ProductImage({ uri, className }: ProductImageProps) {
  return (
    <View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      className={clsx(
        'items-center justify-center overflow-hidden rounded-lg bg-surface-gray',
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
