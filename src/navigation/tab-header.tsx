import type { ReactNode } from 'react';
import { View } from 'react-native';

import { TopAppBar } from '@/shared/ui';

export interface TabHeaderProps {
  title: string;
  /** Extra content under the bar, such as a search field. It sits on the screen ground. */
  children?: ReactNode;
}

/** The top of a tab screen: the top app bar with its title, and anything under it. */
export function TabHeader({ title, children }: TabHeaderProps) {
  return (
    <View>
      <TopAppBar title={title} />
      {children ? <View className="gap-4 px-5 pb-4">{children}</View> : null}
    </View>
  );
}
