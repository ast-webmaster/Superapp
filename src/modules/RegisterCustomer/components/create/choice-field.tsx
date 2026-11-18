import { View } from 'react-native';

import { AppText, ChipGroup, FieldLabel } from '@/shared/ui';

export interface ChoiceFieldProps<V extends string> {
  label: string;
  required?: boolean;
  options: readonly { value: V; label: string }[];
  /** Null until the user chooses: required business fields are never preselected. */
  value: V | null;
  onChange: (value: V) => void;
  error?: string;
}

/** A labelled single choice from a few options, with the field error under it. */
export function ChoiceField<V extends string>({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: ChoiceFieldProps<V>) {
  return (
    <View className="gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <ChipGroup
        label={label}
        options={options}
        value={value ?? ''}
        onChange={(next) => onChange(next as V)}
      />
      {error ? (
        <AppText variant="caption" tone="danger" aria-live="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
