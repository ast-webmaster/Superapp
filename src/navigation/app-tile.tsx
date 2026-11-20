import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ModuleManifest } from '@/shared/types/module';
import { AppText, focusRing, Icon } from '@/shared/ui';

const COLUMNS = 4;

/** An app as a square tile: its icon over a short title. */
export function AppTile({ manifest }: { manifest: ModuleManifest }) {
  return (
    <Pressable
      role="button"
      aria-label={manifest.title}
      onPress={() => router.push(manifest.route as Href)}
      className={clsx(
        'aspect-square flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-2 active:bg-primary-soft',
        focusRing,
      )}>
      <Icon name={manifest.icon ?? 'box'} color="primary" />
      <AppText variant="tile-title" className="text-center" numberOfLines={2}>
        {manifest.title}
      </AppText>
    </Pressable>
  );
}

/** Apps in rows of four. A short last row keeps its tiles the same size. */
export function AppGrid({ manifests }: { manifests: readonly ModuleManifest[] }) {
  const rows: ModuleManifest[][] = [];
  for (let index = 0; index < manifests.length; index += COLUMNS) {
    rows.push(manifests.slice(index, index + COLUMNS));
  }

  return (
    <View className="gap-3">
      {rows.map((row) => (
        <View key={row[0]!.id} className="flex-row gap-3">
          {row.map((manifest) => (
            <AppTile key={manifest.id} manifest={manifest} />
          ))}
          {Array.from({ length: COLUMNS - row.length }, (_, gap) => (
            <View key={gap} className="flex-1" />
          ))}
        </View>
      ))}
    </View>
  );
}
