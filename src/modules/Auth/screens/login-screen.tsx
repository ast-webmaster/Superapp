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
  // Accounts with 2FA answer the first attempt with a validation error on `code`;
  // that reveals the code field, and the same credentials are sent again with the code.
  const [needsCode, setNeedsCode] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ReturnType<typeof toAppError> | null>(null);

  const trimmedCode = code.trim();

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signIn({
        email: email.trim(),
        password,
        ...(needsCode && (useRecoveryCode ? { recoveryCode: trimmedCode } : { code: trimmedCode })),
      });
    } catch (e) {
      // Keep what the user typed so they can fix it and retry.
      const appError = toAppError(e);
      if (appError.fieldErrors?.code) setNeedsCode(true);
      // Asking for a code the user has not been shown yet is a prompt, not an error.
      const isCodePrompt = appError.fieldErrors?.code && !trimmedCode;
      setError(isCodePrompt ? null : appError);
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
        onSubmitEditing={needsCode ? undefined : submit}
      />
      {needsCode ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {useRecoveryCode
              ? 'Enter one of your recovery codes. Each code works once.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </ThemedText>
          <TextField
            label={useRecoveryCode ? 'Recovery code' : 'Authentication code'}
            value={code}
            onChangeText={setCode}
            error={error?.fieldErrors?.code?.[0]}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="one-time-code"
            keyboardType={useRecoveryCode ? 'default' : 'number-pad'}
            textContentType="oneTimeCode"
            onSubmitEditing={submit}
          />
          <Button
            title={useRecoveryCode ? 'Use authenticator code' : 'Use a recovery code'}
            variant="secondary"
            onPress={() => {
              setUseRecoveryCode((value) => !value);
              setCode('');
              setError(null);
            }}
          />
        </>
      ) : null}
      {error && !error.fieldErrors ? (
        <ThemedText type="small" themeColor="danger">
          {error.message}
        </ThemedText>
      ) : null}
      <Button
        title="Sign in"
        onPress={submit}
        loading={submitting}
        disabled={!email || !password || (needsCode && !trimmedCode)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.six,
  },
});
