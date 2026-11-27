import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface OptionRowProps {
  label: string;
  caption?: string | null;
  /** A circle beside the pill, for a row that has a picture of its kind. */
  icon?: IconName;
  /** Draws the check circle, filled with a black pill when true. Leave it out for a plain choice. */
  selected?: boolean;
  /** `button` picks and moves on, `radio` is one of many, `checkbox` is any number. */
  role?: 'button' | 'radio' | 'checkbox';
  disabled?: boolean;
  onPress: () => void;
  /** Replaces the name screen readers build from the label and caption. */
  'aria-label'?: string;
}

/** One choice in a picker list: a soft gray pill that turns black when it is selected. */
export function OptionRow({
  label,
  caption,
  icon,
  selected,
  role = 'button',
  disabled = false,
  onPress,
  'aria-label': ariaLabel,
}: OptionRowProps) {
  const on = selected === true;

  return (
    <Pressable
      role={role}
      accessible
      aria-label={ariaLabel}
      aria-checked={role === 'button' ? undefined : on}
      aria-disabled={disabled}
      accessibilityState={
        role === 'button' ? { selected: on, disabled } : { checked: on, disabled }
      }
      disabled={disabled}
      onPress={onPress}
      className={clsx(
        'flex-row items-center gap-2 rounded-pill',
        disabled && 'opacity-50',
        focusRing,
      )}>
      {({ pressed }) => {
        // The press color goes on these through state: `active:` belongs to the `Pressable` only.
        const fill = on ? 'bg-ink' : pressed ? 'bg-border' : 'bg-surface-gray';
        return (
          <>
            {icon ? (
              <View className={clsx('size-control items-center justify-center rounded-pill', fill)}>
                <Icon name={icon} color={on ? 'on-primary' : 'ink'} />
              </View>
            ) : null}
            <View
              className={clsx(
                'min-h-control min-w-0 flex-1 flex-row items-center gap-3 rounded-pill px-5 py-2',
                fill,
              )}>
              <View className="min-w-0 flex-1">
                <AppText variant="body-strong" tone={on ? 'on-primary' : 'ink'} numberOfLines={2}>
                  {label}
                </AppText>
                {caption ? (
                  <AppText variant="caption" tone={on ? 'on-ink-muted' : 'muted'}>
                    {caption}
                  </AppText>
                ) : null}
              </View>
              {selected === undefined ? null : (
                <View
                  className={clsx(
                    'size-6 items-center justify-center rounded-pill border',
                    on ? 'border-surface bg-surface' : 'border-control-off',
                  )}>
                  <Icon name="check" size={14} color={on ? 'ink' : 'control-off'} />
                </View>
              )}
            </View>
          </>
        );
      }}
    </Pressable>
  );
}
