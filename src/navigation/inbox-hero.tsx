import { clsx } from 'clsx';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useCurrentUser } from '@/core/auth';
import { useInbox } from '@/modules/Inbox';
import { AppText, focusRing, Icon, Skeleton } from '@/shared/ui';
import { formatWeekdayDate } from '@/shared/utils/format';

// The white company mark, drawn half past the card's right edge as its only decoration.
const MARK = require('@/assets/brand/astrindo-icon-white.png');
const MARK_HEIGHT = 220;
const MARK_WIDTH = (MARK_HEIGHT * 1038) / 888;

/**
 * The first thing on Home: how many documents wait for the user. It opens the Inbox tab.
 * Without a count (first load, or a failed load that the inbox list below already reports) it
 * shows a skeleton or nothing, never a made-up zero.
 */
export function InboxHero() {
  const user = useCurrentUser();
  const { data, isPending } = useInbox({ perPage: 1 });

  if (isPending) return <Skeleton className="h-50 w-full rounded-xl" />;
  if (!data) return null;

  const { total } = data;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <Pressable
      role="button"
      aria-label={total === 0 ? 'Inbox, all caught up' : `${total} waiting. Open inbox`}
      onPress={() => router.navigate('/inbox' as Href)}
      className={clsx(
        'overflow-hidden rounded-xl bg-ink p-5 active:bg-primary-pressed',
        focusRing,
      )}>
      <Image
        source={MARK}
        contentFit="contain"
        pointerEvents="none"
        accessible={false}
        style={{
          position: 'absolute',
          top: -10,
          right: -MARK_WIDTH / 2,
          width: MARK_WIDTH,
          height: MARK_HEIGHT,
          opacity: 0.38,
        }}
      />
      <View className="min-h-40 justify-between gap-6">
        <View className="gap-1">
          <AppText variant="title" tone="on-primary" role="heading" numberOfLines={1}>
            {firstName ? `Hi, ${firstName}` : 'Hi'}
          </AppText>
          <AppText tone="on-ink-muted">{formatWeekdayDate(new Date())}</AppText>
        </View>
        <View className="flex-row items-end justify-between gap-4">
          <View>
            <AppText variant="hero" tone="on-primary">
              {total}
            </AppText>
            <AppText tone="on-ink-muted">Waiting for you</AppText>
          </View>
          <View className="size-12 items-center justify-center rounded-pill bg-accent">
            <Icon name="arrow-right" color="ink" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
