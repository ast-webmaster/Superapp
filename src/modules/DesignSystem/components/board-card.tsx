import { clsx } from 'clsx';
import { Children, type ReactNode } from 'react';
import { View } from 'react-native';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { AppText } from '@/shared/ui';

const WIDE_MIN_WIDTH = 900;

interface BoardCardProps {
  number: string;
  title: string;
  /** Share of the 12-column row on wide screens. Phones always get one column. */
  span: number;
  children: ReactNode;
  className?: string;
}

export function BoardCard({ number, title, span, children, className }: BoardCardProps) {
  const wide = useMediaQuery({ minWidth: WIDE_MIN_WIDTH });

  return (
    <View
      className={clsx('min-w-0 gap-5 rounded-xl bg-surface p-6', className)}
      style={wide ? { flexGrow: span, flexShrink: 1, flexBasis: 0 } : undefined}>
      <AppText tone="muted" role="heading" aria-level={2}>
        {number}. {title}
      </AppText>
      {children}
    </View>
  );
}

/** One row of the 12-column grid. Spans in a row should add up to 12. */
export function BoardRow({ children }: { children: ReactNode }) {
  const wide = useMediaQuery({ minWidth: WIDE_MIN_WIDTH });

  return (
    <View className={clsx('gap-4', wide && 'flex-row items-stretch')}>
      {Children.toArray(children)}
    </View>
  );
}

interface TypeRowProps {
  role: string;
  spec: string;
  children: ReactNode;
}

/** A type specimen: name, sample, spec. The three stack on phones. */
export function TypeRow({ role, spec, children }: TypeRowProps) {
  const wide = useMediaQuery({ minWidth: WIDE_MIN_WIDTH });

  return (
    <View className={clsx('gap-x-4 gap-y-1', wide && 'flex-row items-center')}>
      <AppText variant="caption" tone="muted" className="w-16">
        {role}
      </AppText>
      <View className={clsx('min-w-0', wide && 'flex-1')}>{children}</View>
      <AppText variant="caption" tone="muted" className="w-32">
        {spec}
      </AppText>
    </View>
  );
}
