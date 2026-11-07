import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui';

export interface TabHeaderProps {
  title: string;
  /** Extra content under the title, such as a search field. It sits on the white header. */
  children?: ReactNode;
}

/** The white header block at the top of a tab screen. */
export function TabHeader({ title, children }: TabHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className="gap-4 rounded-b-xl bg-surface px-5 pb-5"
      style={{ paddingTop: top + sizes.screenTopGap }}>
      <AppText variant="heading" role="heading">
        {title}
      </AppText>
      {children}
    </View>
  );
}
