import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { sizes } from '@/shared/theme/tokens';
import { Alert, AppText, Button, Logo, Screen, TextField } from '@/shared/ui';

const illustration = require('@/assets/illustrations/login-key.png');

export function LoginScreen() {
  const { top, bottom } = useSafeAreaInsets();
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
    <Screen variant="plain">
      <StatusBar style="dark" />
      <ScrollView
        bounces={false}
        contentContainerClassName="gap-1 px-5"
        contentContainerStyle={{
          paddingTop: top + 24,
          paddingBottom: bottom + sizes.screenTopGap,
        }}
        keyboardShouldPersistTaps="handled">
        <Logo width={112} className="self-center" />
        {/* Decoration only: the heading below says what the screen is. */}
        <Image
          aria-hidden
          contentFit="contain"
          source={illustration}
          style={{ width: '100%', maxWidth: 300, aspectRatio: 1, alignSelf: 'center' }}
        />
        <View className="gap-8">
          <View className="gap-2">
            <AppText variant="display" role="heading">
              Sign in
            </AppText>
            <AppText tone="muted">Use your employee account to continue.</AppText>
          </View>
          <View className="gap-4">
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
              type="password"
              value={password}
              onChangeText={setPassword}
              error={error?.fieldErrors?.password?.[0]}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              onSubmitEditing={needsCode ? undefined : submit}
            />
            {needsCode ? (
              <>
                <AppText variant="caption" tone="muted">
                  {useRecoveryCode
                    ? 'Enter one of your recovery codes. Each code works once.'
                    : 'Enter the 6-digit code from your authenticator app.'}
                </AppText>
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
                  block
                  variant="soft"
                  onPress={() => {
                    setUseRecoveryCode((value) => !value);
                    setCode('');
                    setError(null);
                  }}>
                  {useRecoveryCode ? 'Use authenticator code' : 'Use a recovery code'}
                </Button>
              </>
            ) : null}
          </View>
          {error && !error.fieldErrors ? <Alert tone="danger" message={error.message} /> : null}
          <View className="gap-4">
            <Button
              block
              onPress={submit}
              loading={submitting}
              disabled={!email || !password || (needsCode && !trimmedCode)}>
              Sign in
            </Button>
            <AppText variant="caption" tone="muted" className="text-center">
              Only registered employees can access the app.
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
