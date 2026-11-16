import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { useControllableState } from '@/shared/hooks/use-controllable-state';
import { useRovingFocus } from '@/shared/hooks/use-roving-focus';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  icon?: IconName;
  selected?: boolean;
  /** A thin border instead of a fill. Selected is a primary border and a check, not a color only. */
  outlined?: boolean;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

/** Without an icon it is a filter chip (lavender); with an icon a department switch (primary). */
export function Chip({
  label,
  icon,
  selected = false,
  outlined = false,
  className,
  ...props
}: ChipProps) {
  const selectedStyle = outlined
    ? 'border border-primary bg-surface'
    : icon
      ? 'bg-primary'
      : 'bg-lavender';
  const selectedTone = icon && !outlined ? 'on-primary' : 'primary';
  const leadingIcon = icon ?? (outlined && selected ? 'check' : undefined);

  return (
    <Pressable
      role="button"
      aria-pressed={selected}
      accessibilityState={{ selected }}
      className={clsx(
        'min-h-touch flex-row items-center justify-center gap-2 rounded-pill px-5',
        selected
          ? selectedStyle
          : outlined
            ? 'border border-border bg-surface active:bg-border'
            : 'bg-surface active:bg-border',
        focusRing,
        className,
      )}
      {...props}>
      {leadingIcon ? <Icon name={leadingIcon} color={selected ? selectedTone : 'ink'} /> : null}
      <AppText tone={selected ? selectedTone : 'ink'}>{label}</AppText>
    </Pressable>
  );
}

export interface ChipGroupOption {
  value: string;
  label: string;
  icon?: IconName;
}

export interface ChipGroupProps {
  /** Describes the group for screen readers, for example "Filter by department". */
  label: string;
  options: readonly ChipGroupOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** Single-select chips. Arrow keys, Home and End move the selection. */
export function ChipGroup({
  label,
  options,
  value,
  defaultValue = '',
  onChange,
  className,
}: ChipGroupProps) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange });
  const itemProps = useRovingFocus(
    options.length,
    options.findIndex((option) => option.value === current),
    (index) => {
      const option = options[index];
      if (option) setCurrent(option.value);
    },
  );

  return (
    <View role="group" aria-label={label} className={clsx('flex-row flex-wrap gap-3', className)}>
      {options.map((option, index) => (
        <Chip
          key={option.value}
          label={option.label}
          icon={option.icon}
          selected={option.value === current}
          onPress={() => setCurrent(option.value)}
          {...itemProps(index)}
        />
      ))}
    </View>
  );
}

export interface MultiChipGroupProps {
  /** Describes the group for screen readers, for example "Filter by status". */
  label: string;
  options: readonly ChipGroupOption[];
  /** Selected values. Empty means no narrowing. */
  values: readonly string[];
  onChange: (values: string[]) => void;
  /** Adds a first chip with this label that is selected while nothing else is, and clears on press. */
  allLabel?: string;
  className?: string;
}

/** Multi-select outlined chips: each press toggles one value. */
export function MultiChipGroup({
  label,
  options,
  values,
  onChange,
  allLabel,
  className,
}: MultiChipGroupProps) {
  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  return (
    <View role="group" aria-label={label} className={clsx('flex-row flex-wrap gap-3', className)}>
      {allLabel ? (
        <Chip
          outlined
          label={allLabel}
          selected={values.length === 0}
          onPress={() => onChange([])}
        />
      ) : null}
      {options.map((option) => (
        <Chip
          outlined
          key={option.value}
          label={option.label}
          selected={values.includes(option.value)}
          onPress={() => toggle(option.value)}
        />
      ))}
    </View>
  );
}
