import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, IconButton, TextField } from '@/shared/ui';

import { attendeeError, normalizeEmail } from '../create/draft';

export interface AttendeesFieldProps {
  /** Lower-case emails. */
  value: readonly string[];
  onChange: (value: string[]) => void;
  /** An error from the server or the form, such as an invalid address the draft could not see. */
  error?: string;
}

/** Invite people by email: a user of the app or someone outside. Optional. */
export function AttendeesField({ value, onChange, error }: AttendeesFieldProps) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const add = () => {
    const message = attendeeError(text, value);
    if (message) {
      setProblem(message);
      return;
    }
    onChange([...value, normalizeEmail(text)]);
    setText('');
    setProblem(null);
  };

  return (
    <View className="gap-2">
      <TextField
        label="Invite people"
        help="Optional. Their email, one at a time. They get the meeting in their calendar."
        value={text}
        onChangeText={(next) => {
          setText(next);
          if (problem) setProblem(null);
        }}
        onSubmitEditing={add}
        error={problem ?? error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      <View className="items-start">
        <Button size="sm" variant="soft" iconLeft="plus" disabled={!text.trim()} onPress={add}>
          Add person
        </Button>
      </View>
      {value.length > 0 ? (
        <View className="gap-2">
          {value.map((email) => (
            <View
              key={email}
              className="min-h-touch flex-row items-center gap-3 rounded-lg bg-surface-gray pl-3">
              <AppText numberOfLines={1} className="min-w-0 flex-1">
                {email}
              </AppText>
              <IconButton
                size="xs"
                icon="x"
                label={`Remove ${email}`}
                onPress={() => onChange(value.filter((item) => item !== email))}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
