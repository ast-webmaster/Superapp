import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { sizes } from '@/shared/theme/tokens';
import { Alert, AppText, Button, Logo, Screen, TextField } from '@/shared/ui';

const illustration = require('@/assets/illustrations/login-welcome.png');

export function LoginScreen() {
  const { top } = useSafeAreaInsets();
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
      {/* The hero is black behind the status bar, so its icons must be light. */}
      <StatusBar style="light" />
      {/* No `grow` anywhere: nested flex-grow inside scroll content stretched every child on
          Android. The ScrollView itself is white, so a short form still ends on white. */}
      <ScrollView bounces={false} className="bg-surface" keyboardShouldPersistTaps="handled">
        {/* The artwork hangs ILLUSTRATION_OVERLAP below the hero (negative margin) and the hero
            is raised above the sheet, so the figure's white body runs into the white form. */}
        <View className="bg-ink px-5" style={{ paddingTop: top + sizes.screenTopGap, zIndex: 1 }}>
          <Logo variant="light" width={112} className="self-end" />
          {/* expo-image takes `style`, not `className`. */}
          <Image
            accessible={false}
            contentFit="contain"
            source={illustration}
            style={styles.illustration}
          />
        </View>
        {/* The black behind the sheet shows in its rounded corners. The sheet is white, so the
            gray inputs sit on a surface as the design system requires. */}
        <View className="bg-ink">
          <View className="gap-6 rounded-t-xl bg-surface px-5 pb-10 pt-12">
            <View className="gap-2">
              <AppText variant="title" role="heading">
                Welcome, employee
              </AppText>
              <AppText tone="muted">
                Fill in the form to sign in. Only registered employees can access the app.
              </AppText>
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
            <Button
              block
              onPress={submit}
              loading={submitting}
              disabled={!email || !password || (needsCode && !trimmedCode)}>
              Sign in
            </Button>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

// The artwork is 200x156. These are layout sizes, not looks, so they live here as a style.
const ILLUSTRATION_OVERLAP = 32;
const styles = StyleSheet.create({
  illustration: {
    width: '75%',
    aspectRatio: 200 / 156,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: -ILLUSTRATION_OVERLAP,
  },
});
