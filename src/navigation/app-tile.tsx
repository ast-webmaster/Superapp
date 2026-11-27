import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import type { ModuleManifest } from '@/shared/types/module';
import { AppText, focusRing, Icon, MorphLink, pressScale } from '@/shared/ui';

const COLUMNS = 4;

/** An app as a round icon button over a short title. */
export function AppTile({ manifest }: { manifest: ModuleManifest }) {
  return (
    <MorphLink href={manifest.route as Href}>
      <Pressable
        role="button"
        aria-label={manifest.title}
        className={clsx('flex-1 items-center gap-2 rounded-lg', pressScale, focusRing)}>
        {({ pressed }) => (
          <>
            {/* The press color goes here through state: `active:` belongs to the `Pressable` only. */}
            <View
              className={clsx(
                'size-control items-center justify-center rounded-pill',
                pressed ? 'bg-highlight' : 'bg-surface',
              )}>
              <Icon name={manifest.icon ?? 'box'} color="ink" />
            </View>
            <AppText variant="tile-title" className="text-center" numberOfLines={2}>
              {manifest.title}
            </AppText>
          </>
        )}
      </Pressable>
    </MorphLink>
  );
}

/** Apps in rows of four. A short last row keeps the same columns. */
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
