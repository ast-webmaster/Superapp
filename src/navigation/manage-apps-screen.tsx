import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';
import type { ModuleManifest } from '@/shared/types/module';
import {
  AppText,
  EmptyState,
  focusRing,
  Icon,
  ListGroup,
  Screen,
  type IconName,
} from '@/shared/ui';

import { useFavoriteApps } from './use-favorite-apps';

export function ManageAppsScreen() {
  const { bottom } = useSafeAreaInsets();
  const { favorites, others, add, remove, move } = useFavoriteApps();

  if (favorites.length === 0 && others.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="grid"
          title="No apps yet"
          description="Your account has no access to any app."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* The stack header carries the title, so content starts right under it. */}
      <ScrollView
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}>
        <View className="gap-2">
          <AppText variant="title" role="heading">
            Favorite apps
          </AppText>
          <AppText tone="muted">They show on Home in this order.</AppText>
          {favorites.length === 0 ? (
            <AppText tone="muted">No favorite apps. Add some from the list below.</AppText>
          ) : (
            <ListGroup>
              {favorites.map((manifest, index) => (
                <AppRow key={manifest.id} manifest={manifest}>
                  <RowButton
                    icon="arrow-up"
                    label={`Move ${manifest.title} up`}
                    disabled={index === 0}
                    onPress={() => move(manifest.id, -1)}
                  />
                  <RowButton
                    icon="arrow-down"
                    label={`Move ${manifest.title} down`}
                    disabled={index === favorites.length - 1}
                    onPress={() => move(manifest.id, 1)}
                  />
                  <RowButton
                    icon="minus"
                    label={`Remove ${manifest.title} from favorites`}
                    onPress={() => remove(manifest.id)}
                  />
                </AppRow>
              ))}
            </ListGroup>
          )}
        </View>

        {others.length > 0 ? (
          <View className="gap-2">
            <AppText variant="title" role="heading">
              More apps
            </AppText>
            <ListGroup>
              {others.map((manifest) => (
                <AppRow key={manifest.id} manifest={manifest}>
                  <RowButton
                    icon="plus"
                    label={`Add ${manifest.title} to favorites`}
                    onPress={() => add(manifest.id)}
                  />
                </AppRow>
              ))}
            </ListGroup>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function AppRow({ manifest, children }: { manifest: ModuleManifest; children: ReactNode }) {
  return (
    <View className="min-h-control flex-row items-center gap-3 py-1">
      <Icon name={manifest.icon ?? 'box'} color="primary" />
      <AppText variant="body-strong" className="min-w-0 flex-1">
        {manifest.title}
      </AppText>
      {children}
    </View>
  );
}

/** A 48 press area around a bare icon. */
function RowButton({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={clsx(
        'size-touch items-center justify-center rounded-pill active:bg-surface-gray',
        disabled && 'opacity-50',
        focusRing,
      )}>
      <Icon name={icon} />
    </Pressable>
  );
}
