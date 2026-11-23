import { View } from 'react-native';

import { AppText, ChipGroup, FieldLabel } from '@/shared/ui';

export interface ChoiceFieldProps {
  label: string;
  required?: boolean;
  options: readonly { value: string; label: string }[];
  /** Null until the user chooses: required business fields are never preselected. */
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}

/** A labelled single choice from a few options, with the field error under it. */
export function ChoiceField({
  label,
  required,
  options,
  value,
  onChange,
  error,
}: ChoiceFieldProps) {
  return (
    <View className="gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <ChipGroup label={label} options={options} value={value ?? ''} onChange={onChange} />
      {error ? (
        <AppText variant="caption" tone="danger" aria-live="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
