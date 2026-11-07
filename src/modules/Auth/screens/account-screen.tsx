import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore, useCurrentUser } from '@/core/auth';
import { sizes } from '@/shared/theme/tokens';
import { AppText, Button, Icon, Screen } from '@/shared/ui';

export function AccountScreen() {
  const { bottom } = useSafeAreaInsets();
  const user = useCurrentUser();
  const signOut = useAuthStore((state) => state.signOut);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Screen>
      {/* The stack header carries the title, so content starts right under it. */}
      <ScrollView
        contentContainerClassName="gap-4 px-5"
        contentContainerStyle={{ paddingTop: sizes.screenTopGap, paddingBottom: bottom + sizes.screenTopGap }}>
        <View className="flex-row items-center gap-4 rounded-xl bg-surface p-4 shadow-card">
          <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
            <Icon name="user" color="primary" />
          </View>
          <View className="min-w-0 flex-1">
            <AppText variant="module-title">{user?.name}</AppText>
            <AppText tone="muted">{user?.email}</AppText>
          </View>
        </View>
        <Button
          block
          variant="secondary"
          loading={signingOut}
          onPress={() => {
            setSigningOut(true);
            void signOut();
          }}>
          Sign out
        </Button>
      </ScrollView>
    </Screen>
  );
}
