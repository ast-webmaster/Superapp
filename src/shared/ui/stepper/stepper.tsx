import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { useControllableState } from '@/shared/hooks/use-controllable-state';

import { announce } from '../announce';
import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface StepperProps {
  /** What the number counts, for screen readers, for example "Quantity". */
  label: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function Stepper({
  label,
  value,
  defaultValue = 0,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  onChange,
  className,
}: StepperProps) {
  const [raw, setRaw] = useControllableState({ value, defaultValue, onChange });
  const current = Math.min(max, Math.max(min, raw));

  const change = (next: number) => {
    setRaw(next);
    announce(`${label} ${next}`);
  };

  return (
    <View
      role="group"
      aria-label={label}
      className={clsx(
        'flex-row items-center self-start rounded-pill bg-surface shadow-card',
        className,
      )}>
      <StepButton
        icon="minus"
        label={`Decrease ${label}`}
        disabled={current <= min}
        onPress={() => change(current - 1)}
      />
      <AppText
        variant="title"
        aria-live="polite"
        className="min-w-8 text-center"
        style={{ fontVariant: ['tabular-nums'] }}>
        {current}
      </AppText>
      <StepButton
        icon="plus"
        label={`Increase ${label}`}
        disabled={current >= max}
        onPress={() => change(current + 1)}
      />
    </View>
  );
}

interface StepButtonProps {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}

function StepButton({ icon, label, disabled, onPress }: StepButtonProps) {
  return (
    // The press area is 48; the visible circle inside it is 40.
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className={clsx('size-touch items-center justify-center rounded-pill', focusRing)}>
      <View
        className={clsx(
          'size-10 items-center justify-center rounded-pill bg-surface-gray',
          disabled && 'opacity-50',
        )}>
        <Icon name={icon} size={20} />
      </View>
    </Pressable>
  );
}
