import { clsx } from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentUser, useRoles } from '@/core/auth';
import { profilePhotoUri } from '@/modules/Auth';
import { InboxRow, InboxRowsSkeleton, useInbox, useRefreshInboxOnFocus } from '@/modules/Inbox';
import { colors, sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Avatar,
  Badge,
  focusRing,
  ListGroup,
  Logo,
  Screen,
  Skeleton,
  useBottomNavInset,
} from '@/shared/ui';
import { formatRoles, formatWeekdayDate } from '@/shared/utils/format';

import { FavoriteAppTile } from './favorite-app-tile';
import { inboxRowProps } from './inbox-row-props';
import { useFavoriteApps } from './use-favorite-apps';

const INBOX_PREVIEW = 5;

export function HomeScreen() {
  const user = useCurrentUser();
  const roles = useRoles();
  const { favorites, ready } = useFavoriteApps();
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomNavInset();
  useRefreshInboxOnFocus();

  const roleLabel = formatRoles(roles);

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="grow"
        contentContainerStyle={{ paddingBottom: bottomInset }}>
        {/* Lavender fading into the screen ground behind the top of the screen. The gradient takes `style`, not
            `className`, so the layout sits on the plain View inside it. */}
        <LinearGradient
          colors={[colors.lavender, colors.ground]}
          style={{ paddingTop: top + sizes.screenTopGap }}>
          <View className="gap-4 px-5 pb-6">
            {/* Logo above the card, the account button on the other side. */}
            <View className="flex-row items-center justify-between gap-4">
              <Logo width={112} />
              <Pressable
                role="button"
                aria-label="Profile"
                onPress={() => router.push('/profile' as Href)}
                className={clsx('rounded-pill', focusRing)}>
                <Avatar size="sm" name={user?.name ?? ''} uri={profilePhotoUri(user ?? null)} />
              </Pressable>
            </View>
            <View className="gap-2 rounded-2xl bg-ink p-5">
              <AppText tone="on-primary">{formatWeekdayDate(new Date())}</AppText>
              <AppText variant="display" tone="on-primary" role="heading" numberOfLines={1}>
                {user?.name}
              </AppText>
              {roleLabel ? <Badge size="xs" tone="info" label={roleLabel} /> : null}
            </View>
          </View>
        </LinearGradient>

        <View className="gap-4 px-5">
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <AppText variant="title" role="heading">
                Favorite apps
              </AppText>
              <Pressable
                role="link"
                onPress={() => router.push('/manage-apps' as Href)}
                className={clsx('min-h-touch justify-center rounded-pill px-2', focusRing)}>
                <AppText variant="body-strong" tone="primary">
                  Manage apps
                </AppText>
              </Pressable>
            </View>
            {!ready ? (
              <Skeleton className="h-24 w-full" />
            ) : favorites.length === 0 ? (
              <AppText tone="muted">No favorite apps yet. Choose some with Manage apps.</AppText>
            ) : (
              <View className="flex-row flex-wrap">
                {favorites.map((manifest) => (
                  <FavoriteAppTile key={manifest.id} manifest={manifest} />
                ))}
              </View>
            )}
          </View>

          <FavoriteInbox moduleIds={favorites.map((manifest) => manifest.id)} ready={ready} />
        </View>
      </ScrollView>
    </Screen>
  );
}

/** The waiting documents of the favorite apps only. */
function FavoriteInbox({ moduleIds, ready }: { moduleIds: string[]; ready: boolean }) {
  const hasFavorites = moduleIds.length > 0;
  const { data, error, isPending } = useInbox({
    modules: moduleIds,
    perPage: INBOX_PREVIEW,
    enabled: ready && hasFavorites,
  });

  return (
    <View className="gap-2">
      <AppText variant="title" role="heading">
        Favorite inbox
      </AppText>
      {!ready ? (
        <InboxRowsSkeleton />
      ) : !hasFavorites ? (
        <AppText tone="muted">Add favorite apps to see what is waiting in them.</AppText>
      ) : data ? (
        data.items.length === 0 ? (
          <AppText tone="muted">Nothing is waiting in your favorite apps.</AppText>
        ) : (
          <ListGroup>
            {data.items.map((item) => (
              <InboxRow key={item.id} item={item} {...inboxRowProps(item)} />
            ))}
          </ListGroup>
        )
      ) : error ? (
        <Alert tone="warning" message="Could not load your inbox. Try again later." />
      ) : isPending ? (
        <InboxRowsSkeleton />
      ) : null}
    </View>
  );
}
