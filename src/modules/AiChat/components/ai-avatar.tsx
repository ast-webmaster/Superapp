import { View } from 'react-native';

import { Icon } from '@/shared/ui';

/** The small round AI mark beside each answer. Decorative: the card already reads as the reply. */
export function AiAvatar() {
  return (
    <View className="size-6 items-center justify-center rounded-pill bg-primary" aria-hidden>
      <Icon name="ai" size={14} color="on-primary" />
    </View>
  );
}
