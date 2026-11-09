import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ModuleManifest } from '@/shared/types/module';
import { AppText, focusRing, Icon } from '@/shared/ui';

/** One favorite app on Home: a round icon over its name. Four fit in a row. */
export function FavoriteAppTile({ manifest }: { manifest: ModuleManifest }) {
  return (
    <Pressable
      role="button"
      aria-label={manifest.title}
      onPress={() => router.push(manifest.route as Href)}
      className={clsx('w-1/4 items-center gap-2 rounded-md py-2', focusRing)}>
      <View className="size-control items-center justify-center rounded-pill bg-surface">
        <Icon name={manifest.icon ?? 'box'} color="primary" />
      </View>
      <AppText variant="label" tone="muted" numberOfLines={2} className="text-center">
        {manifest.title}
      </AppText>
    </Pressable>
  );
}
