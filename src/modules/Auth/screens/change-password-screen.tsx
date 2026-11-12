import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/core/auth';
import { toAppError } from '@/core/errors';
import { sizes } from '@/shared/theme/tokens';
import { Alert, Button, Screen, TextField } from '@/shared/ui';

type Field = 'current_password' | 'password' | 'password_confirmation';

export function ChangePasswordScreen() {
  const { bottom } = useSafeAreaInsets();
  const changePassword = useAuthStore((state) => state.changePassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    // Obvious mistakes never leave the device; the server checks again.
    const problems: Partial<Record<Field, string>> = {};
    if (!currentPassword) problems.current_password = 'Enter your current password.';
    if (!password) problems.password = 'Enter a new password.';
    else if (password !== passwordConfirmation)
      problems.password_confirmation = 'The passwords do not match.';
    setErrors(problems);
    setFormError(undefined);
    setSaved(false);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      await changePassword({ currentPassword, password, passwordConfirmation });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      setSaved(true);
    } catch (error) {
      const failure = toAppError(error);
      const fieldErrors = failure.fieldErrors;
      if (failure.code === 'validation' && fieldErrors) {
        setErrors({
          current_password: fieldErrors.current_password?.[0],
          password: fieldErrors.password?.[0],
          password_confirmation: fieldErrors.password_confirmation?.[0],
        });
      } else {
        setFormError(failure.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-6 px-5"
        contentContainerStyle={{
          paddingTop: sizes.screenTopGap,
          paddingBottom: bottom + sizes.screenTopGap,
        }}>
        {saved ? (
          <Alert
            tone="success"
            message="Password changed. Your other devices were signed out."
            onDismiss={() => setSaved(false)}
          />
        ) : null}
        {formError ? <Alert tone="danger" message={formError} /> : null}

        <View className="gap-4 rounded-xl bg-surface p-5 border border-border">
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            error={errors.current_password}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
            help="Use at least 8 characters."
            error={errors.password}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            error={errors.password_confirmation}
          />
        </View>

        <Button block loading={saving} onPress={() => void save()}>
          Change password
        </Button>
      </ScrollView>
    </Screen>
  );
}
