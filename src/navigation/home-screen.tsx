import { router, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';
import { AppText, IconButton, InfoCard, Logo, Screen, useBottomNavInset } from '@/shared/ui';

import { useInboxCount } from './use-inbox-count';

export function HomeScreen() {
  const inboxCount = useInboxCount();
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomNavInset();

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="grow gap-4"
        contentContainerStyle={{ paddingBottom: bottomInset }}>
        <View
          className="gap-4 rounded-b-xl bg-surface px-5 pb-5"
          style={{ paddingTop: top + sizes.screenTopGap }}>
          <View className="flex-row items-center justify-between">
            <Logo width={136} className="py-2" />
            <IconButton icon="user" label="Account" onPress={() => router.push('/account' as Href)} />
          </View>
          <AppText variant="heading" role="heading">
            Home
          </AppText>
        </View>
        <View className="px-5">
          <InfoCard
            icon="bell"
            title="Inbox"
            description={inboxCount > 0 ? `${inboxCount} waiting for you` : 'Nothing new'}
            onPress={() => router.navigate('/inbox' as Href)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
