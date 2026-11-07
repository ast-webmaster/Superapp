import { clsx } from 'clsx';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { announce } from '../announce';
import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

const tones = {
  success: { container: 'bg-success-bg', dot: 'bg-success', icon: 'check' },
  danger: { container: 'bg-danger-bg', dot: 'bg-danger', icon: 'x' },
  warning: { container: 'bg-warning-bg', dot: 'bg-warning', icon: 'alert' },
  info: { container: 'bg-primary-soft', dot: 'bg-primary', icon: 'info' },
} as const satisfies Record<string, { container: string; dot: string; icon: IconName }>;

export type AlertTone = keyof typeof tones;

export interface AlertProps {
  tone: AlertTone;
  /** One sentence. */
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ tone, message, onDismiss, className }: AlertProps) {
  const style = tones[tone];
  const urgent = tone === 'danger';

  useEffect(() => {
    announce(message);
  }, [message]);

  return (
    <View
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-lg py-1 pl-4',
        onDismiss ? 'pr-1' : 'pr-4',
        style.container,
        className,
      )}>
      <View className={clsx('size-7 items-center justify-center rounded-pill', style.dot)}>
        <Icon name={style.icon} size={16} color="on-primary" />
      </View>
      <AppText
        role={urgent ? 'alert' : 'status'}
        aria-live={urgent ? 'assertive' : 'polite'}
        className="min-w-0 flex-1">
        {message}
      </AppText>
      {onDismiss ? (
        <Pressable
          role="button"
          aria-label="Dismiss"
          onPress={onDismiss}
          className={clsx('size-touch items-center justify-center rounded-pill', focusRing)}>
          <Icon name="x" />
        </Pressable>
      ) : null}
    </View>
  );
}
