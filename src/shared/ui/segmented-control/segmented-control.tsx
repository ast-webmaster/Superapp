import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { useControllableState } from '@/shared/hooks/use-controllable-state';
import { useRovingFocus } from '@/shared/hooks/use-roving-focus';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: IconName;
}

export interface SegmentedControlProps {
  /** Describes the choice for screen readers, for example "View as". */
  label: string;
  /** Two to four options. */
  options:
    | readonly [SegmentedOption, SegmentedOption]
    | readonly [SegmentedOption, SegmentedOption, SegmentedOption]
    | readonly [SegmentedOption, SegmentedOption, SegmentedOption, SegmentedOption];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  label,
  options,
  value,
  defaultValue,
  onChange,
  className,
}: SegmentedControlProps) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? options[0].value,
    onChange,
  });
  const itemProps = useRovingFocus(
    options.length,
    options.findIndex((option) => option.value === current),
    (index) => {
      const option = options[index];
      if (option) setCurrent(option.value);
    },
  );

  return (
    <View
      role="radiogroup"
      aria-label={label}
      className={clsx('flex-row self-start rounded-pill bg-surface-gray px-0.5', className)}>
      {options.map((option, index) => {
        const selected = option.value === current;

        return (
          // The press area is 48 tall; the visible segment inside it is 44.
          <Pressable
            key={option.value}
            role="radio"
            aria-label={option.label}
            aria-checked={selected}
            onPress={() => setCurrent(option.value)}
            className={clsx('min-h-touch justify-center rounded-pill py-0.5', focusRing)}
            {...itemProps(index)}>
            <View
              className={clsx(
                'min-h-11 flex-row items-center justify-center gap-2 rounded-pill px-5',
                selected && 'bg-primary',
              )}>
              {option.icon ? (
                <Icon name={option.icon} color={selected ? 'on-primary' : 'ink'} />
              ) : null}
              <AppText tone={selected ? 'on-primary' : 'ink'}>{option.label}</AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
