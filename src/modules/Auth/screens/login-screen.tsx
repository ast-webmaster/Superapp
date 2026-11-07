import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useAuthStore } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { Button } from '@/shared/components/button';
import { Screen } from '@/shared/components/screen';
import { TextField } from '@/shared/components/text-field';
import { ThemedText } from '@/shared/components/themed-text';
import { Spacing } from '@/shared/theme';

export function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ReturnType<typeof toAppError> | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn({ email: email.trim(), password });
    } catch (e) {
      // Keep what the user typed so they can fix it and retry.
      setError(toAppError(e));
      setSubmitting(false);
    }
    // On success the route guard swaps this screen out, so there is nothing to reset.
  };

  return (
    <Screen>
      <ThemedText type="subtitle" style={styles.title}>
        Sign in
      </ThemedText>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={error?.fieldErrors?.email?.[0]}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={error?.fieldErrors?.password?.[0]}
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        textContentType="password"
        onSubmitEditing={submit}
      />
      {error && !error.fieldErrors ? (
        <ThemedText type="small" themeColor="danger">
          {error.message}
        </ThemedText>
      ) : null}
      <Button title="Sign in" onPress={submit} loading={submitting} disabled={!email || !password} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.six,
  },
});
