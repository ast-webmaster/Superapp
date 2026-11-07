import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { View } from 'react-native';

interface GlassSurfaceProps {
  children: ReactNode;
  className?: string;
}

/** Glass where the browser supports backdrop-filter, solid surface otherwise. */
export function GlassSurface({ children, className }: GlassSurfaceProps) {
  return (
    <View
      className={clsx(
        'bg-surface shadow-glass supports-[backdrop-filter:blur(1px)]:bg-glass supports-[backdrop-filter:blur(1px)]:backdrop-blur-glass',
        className,
      )}>
      {children}
    </View>
  );
}
