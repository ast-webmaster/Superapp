import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore, useCurrentUser, useRoles } from '@/core/auth';
import { sizes } from '@/shared/theme/tokens';
import { AppText, Avatar, Badge, ListGroup, ListRow, Screen, useConfirm } from '@/shared/ui';
import { formatRoles } from '@/shared/utils/format';

import { AvatarEditButton } from '../components/avatar-edit-button';
import { profilePhotoUri } from '../profile-photo';

export function ProfileScreen() {
  const { bottom } = useSafeAreaInsets();
  const user = useCurrentUser();
  const roleLabel = formatRoles(useRoles());
  const signOut = useAuthStore((state) => state.signOut);
  const [signingOut, setSigningOut] = useState(false);
  const name = user?.name ?? '';

  const confirm = useConfirm();

  const askSignOut = () =>
    confirm({
      title: 'Sign out of this device?',
      confirmLabel: 'Sign out',
      icon: 'log-out',
      destructive: true,
      onConfirm: () => {
        setSigningOut(true);
        void signOut();
      },
    });

  return (
    <Screen>
      {/* The stack header carries the title, so content starts right under it. */}
      <ScrollView
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}>
        <View className="items-center gap-4">
          <View>
            <Avatar size="xl" name={name} uri={profilePhotoUri(user)} />
            <AvatarEditButton
              label="Edit profile"
              onPress={() => router.push('/edit-profile' as Href)}
            />
          </View>
          <View className="items-center gap-2">
            <AppText variant="display" role="heading" className="text-center">
              {name}
            </AppText>
            {/* In a row the badge's own self-start sits on the cross axis, so the row centers it. */}
            {roleLabel ? (
              <View className="flex-row justify-center">
                <Badge size="xs" tone="info" label={roleLabel} />
              </View>
            ) : null}
          </View>
        </View>

        <View className="gap-2">
          <AppText variant="label" tone="muted">
            Account
          </AppText>
          <ListGroup>
            <ListRow
              icon="user"
              label="Edit profile"
              onPress={() => router.push('/edit-profile' as Href)}
            />
            <ListRow
              icon="lock"
              label="Change password"
              onPress={() => router.push('/change-password' as Href)}
            />
            <ListRow
              icon="log-out"
              label="Sign out"
              destructive
              disabled={signingOut}
              onPress={askSignOut}
            />
          </ListGroup>
        </View>
      </ScrollView>
    </Screen>
  );
}
