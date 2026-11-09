import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { focusRing, Icon } from '@/shared/ui';

export interface AvatarEditButtonProps {
  /** What it does, for screen readers. */
  label: string;
  onPress: () => void;
}

/** The dark pencil dot on an avatar's corner. The visible dot is 40, inside a 48 press area. */
export function AvatarEditButton({ label, onPress }: AvatarEditButtonProps) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      className={clsx(
        'absolute -bottom-1 -right-1 size-touch items-center justify-center rounded-pill',
        focusRing,
      )}>
      <View className="size-10 items-center justify-center rounded-pill bg-ink">
        <Icon name="pencil" size={18} color="on-primary" />
      </View>
    </Pressable>
  );
}
