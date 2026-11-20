import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrentUser } from '@/core/auth';
import { profilePhotoUri } from '@/modules/Auth';
import { InboxRow, InboxRowsSkeleton, useInbox, useRefreshInboxOnFocus } from '@/modules/Inbox';
import { sizes } from '@/shared/theme/tokens';
import {
  Alert,
  AppText,
  Avatar,
  focusRing,
  IconButton,
  ListGroup,
  Logo,
  Screen,
  Skeleton,
  useBottomNavInset,
} from '@/shared/ui';

import { AppGrid } from './app-tile';
import { InboxHero } from './inbox-hero';
import { inboxRowProps } from './inbox-row-props';
import { useFavoriteApps } from './use-favorite-apps';

const INBOX_PREVIEW = 5;

export function HomeScreen() {
  const user = useCurrentUser();
  const { favorites, ready } = useFavoriteApps();
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomNavInset();
  useRefreshInboxOnFocus();

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="grow"
        contentContainerStyle={{ paddingBottom: bottomInset }}>
        <View
          className="flex-row items-center gap-3 px-5 pb-5"
          style={{ paddingTop: top + sizes.screenTopGap }}>
          <View className="flex-1 items-start">
            <Logo width={112} />
          </View>
          <InboxBell />
          <Pressable
            role="button"
            aria-label="Profile"
            onPress={() => router.push('/profile' as Href)}
            className={clsx('rounded-pill', focusRing)}>
            <Avatar size="sm" name={user?.name ?? ''} uri={profilePhotoUri(user ?? null)} />
          </Pressable>
        </View>

        <View className="gap-5 px-5">
          <InboxHero />
          <View className="gap-3">
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
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : favorites.length === 0 ? (
              <AppText tone="muted">No favorite apps yet. Choose some with Manage apps.</AppText>
            ) : (
              <AppGrid manifests={favorites} />
            )}
          </View>

          <FavoriteInbox moduleIds={favorites.map((manifest) => manifest.id)} ready={ready} />
        </View>
      </ScrollView>
    </Screen>
  );
}

/** The bell in the header: opens the Inbox tab, with a dot while something waits. */
function InboxBell() {
  const { data } = useInbox({ perPage: 1 });
  const total = data?.total ?? 0;

  return (
    <View>
      <IconButton
        icon="bell"
        size="sm"
        label={total > 0 ? `Inbox, ${total} waiting` : 'Inbox'}
        onPress={() => router.navigate('/inbox' as Href)}
      />
      {total > 0 ? (
        <View
          pointerEvents="none"
          className="absolute top-2.5 right-2.5 size-3 rounded-pill border-2 border-surface bg-danger"
        />
      ) : null}
    </View>
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
