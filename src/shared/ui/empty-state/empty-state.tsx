import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '../icon/icon';
import { AppText } from '../text/text';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  /** The next step, for example a retry `Button`. */
  children?: ReactNode;
  className?: string;
}

/** Nothing to show, or something went wrong. Fills the space it is given. */
export function EmptyState({ title, description, icon, children, className }: EmptyStateProps) {
  return (
    <View className={clsx('flex-1 items-center justify-center gap-4 p-5', className)}>
      {icon ? (
        <View className="size-control items-center justify-center rounded-pill bg-primary-soft">
          <Icon name={icon} color="primary" />
        </View>
      ) : null}
      <View className="items-center gap-1">
        <AppText variant="title" className="text-center">
          {title}
        </AppText>
        {description ? (
          <AppText tone="muted" className="text-center">
            {description}
          </AppText>
        ) : null}
      </View>
      {/* Button aligns itself to the start, so it needs a wrapper to be centered. */}
      {children ? <View className="items-center">{children}</View> : null}
    </View>
  );
}
