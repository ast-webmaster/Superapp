import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { AppText, FieldLabel, focusRing, Icon } from '@/shared/ui';

export interface PickerFieldProps {
  label: string;
  required?: boolean;
  /** What is chosen, or null to show the placeholder. */
  value: string | null;
  placeholder: string;
  onPress: () => void;
  help?: string;
  error?: string;
  disabled?: boolean;
}

/** A field that looks like a `TextField` but opens a sheet to choose from. */
export function PickerField({
  label,
  required,
  value,
  placeholder,
  onPress,
  help,
  error,
  disabled = false,
}: PickerFieldProps) {
  const message = error ?? help;

  return (
    <View className="gap-1">
      <FieldLabel required={required}>{label}</FieldLabel>
      <Pressable
        role="button"
        aria-label={`${label}, ${value ?? placeholder}`}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={onPress}
        className={clsx(
          'min-h-control flex-row items-center gap-3 rounded-lg border-2 bg-surface px-4',
          error ? 'border-danger' : 'border-border',
          disabled && 'opacity-50',
          focusRing,
        )}>
        <AppText tone={value ? 'ink' : 'muted'} numberOfLines={1} className="min-w-0 flex-1">
          {value ?? placeholder}
        </AppText>
        <Icon name="chevron-right" color="ink-muted" />
      </Pressable>
      {message ? (
        <AppText
          variant="caption"
          tone={error ? 'danger' : 'muted'}
          aria-live={error ? 'polite' : undefined}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
