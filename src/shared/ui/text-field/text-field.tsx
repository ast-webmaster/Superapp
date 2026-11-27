import { clsx } from 'clsx';
import { useEffect, useId, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/shared/theme/tokens';

import { announce } from '../announce';
import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { FieldLabel } from '../field-label/field-label';
import { AppText } from '../text/text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  /** Visible label. Without it, set `aria-label` so screen readers can still name the field. */
  label?: string;
  /** Marks the label with a red asterisk. Leave it off for an optional field. */
  required?: boolean;
  type?: 'text' | 'password';
  /** `search` is the gray pill used for the search field in a sheet. */
  variant?: 'outline' | 'search';
  icon?: IconName;
  help?: string;
  error?: string;
  trailing?: ReactNode;
  className?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  required,
  type = 'text',
  variant = 'outline',
  icon,
  help,
  error,
  trailing,
  className,
  onFocus,
  onBlur,
  placeholder,
  'aria-label': ariaLabel,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const messageId = useId();
  const message = error ?? help;

  useEffect(() => {
    if (error) announce(error);
  }, [error]);

  return (
    <View className={clsx('gap-1', className)}>
      {label ? <FieldLabel required={required}>{label}</FieldLabel> : null}
      <View
        className={clsx(
          'min-h-control flex-row items-center gap-3 border-2 px-4',
          variant === 'search' ? 'rounded-pill bg-surface-gray' : 'rounded-lg bg-surface',
          error
            ? 'border-danger'
            : focused
              ? 'border-primary'
              : variant === 'search'
                ? 'border-transparent'
                : 'border-border',
        )}>
        {icon ? <Icon name={icon} color={variant === 'search' ? 'ink-muted' : 'ink'} /> : null}
        <TextInput
          aria-label={ariaLabel ?? label ?? placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          accessibilityHint={message}
          placeholder={placeholder}
          placeholderTextColor={colors['ink-muted']}
          secureTextEntry={type === 'password' && !revealed}
          className="min-w-0 flex-1 self-stretch font-sora text-body text-ink outline-none"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {trailing}
        {type === 'password' ? (
          <Pressable
            role="button"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((current) => !current)}
            className={clsx(
              'size-touch -mr-3 items-center justify-center rounded-pill',
              focusRing,
            )}>
            <Icon name={revealed ? 'eye' : 'eye-off'} />
          </Pressable>
        ) : null}
      </View>
      {message ? (
        <AppText
          nativeID={messageId}
          variant="caption"
          tone={error ? 'danger' : 'muted'}
          aria-live={error ? 'polite' : undefined}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}
