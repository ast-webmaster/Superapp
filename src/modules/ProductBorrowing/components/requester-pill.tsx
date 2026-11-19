import { View } from 'react-native';

import { AppText, Icon } from '@/shared/ui';

/** Who requested it: a small gray pill with a user icon. Shrinks and truncates a long name. */
export function RequesterPill({ name }: { name: string }) {
  return (
    <View className="min-h-6 shrink flex-row items-center gap-1 self-start rounded-pill bg-surface-gray px-2">
      <Icon name="user" size={12} />
      <AppText variant="label" numberOfLines={1} className="shrink">
        {name}
      </AppText>
    </View>
  );
}
