import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme';

import { ThemedText } from './themed-text';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <ThemedText type="subtitle" style={styles.text}>
        {title}
      </ThemedText>
      {description ? (
        <ThemedText themeColor="textSecondary" style={styles.text}>
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
});
