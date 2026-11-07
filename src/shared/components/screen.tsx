import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/theme';

import { ThemedView } from './themed-view';

type ScreenProps = {
  children: ReactNode;
  /** The screen sits under a navigation header, so skip the top safe-area inset. */
  hasHeader?: boolean;
  /** The screen sits above the bottom tab bar. */
  withTabInset?: boolean;
};

export function Screen({ children, hasHeader = false, withTabInset = false }: ScreenProps) {
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView
        edges={hasHeader ? ['left', 'right', 'bottom'] : undefined}
        style={[styles.content, withTabInset && { paddingBottom: BottomTabInset + Spacing.three }]}>
        {children}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
});
