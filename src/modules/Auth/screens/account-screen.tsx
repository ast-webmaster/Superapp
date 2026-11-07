import { useState } from 'react';

import { useAuthStore, useCurrentUser } from '@/core/auth';
import { Button } from '@/shared/components/button';
import { Screen } from '@/shared/components/screen';
import { ThemedText } from '@/shared/components/themed-text';

export function AccountScreen() {
  const user = useCurrentUser();
  const signOut = useAuthStore((state) => state.signOut);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <Screen withTabInset>
      <ThemedText type="subtitle">{user?.name}</ThemedText>
      <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
      <Button
        title="Sign out"
        variant="secondary"
        loading={signingOut}
        onPress={() => {
          setSigningOut(true);
          void signOut();
        }}
      />
    </Screen>
  );
}
