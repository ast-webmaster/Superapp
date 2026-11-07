import { clsx } from 'clsx';
import type { ComponentRef, Ref } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { focusRing } from '../focus';
import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface InfoCardProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  description: string;
  icon: IconName;
  className?: string;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}

export function InfoCard({ title, description, icon, className, ...props }: InfoCardProps) {
  return (
    <Pressable
      role="button"
      className={clsx(
        'flex-row items-center gap-4 self-stretch rounded-lg bg-primary-soft p-4 active:bg-lavender',
        focusRing,
        className,
      )}
      {...props}>
      <View className="size-touch items-center justify-center rounded-md bg-lavender">
        <Icon name={icon} color="primary" />
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="info-title">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      <Icon name="chevron-right" color="primary" />
    </Pressable>
  );
}
