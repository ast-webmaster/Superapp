import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/theme';

import { Button } from './button';
import { ThemedText } from './themed-text';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <ThemedText style={styles.text}>{message}</ThemedText>
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  text: {
    textAlign: 'center',
  },
});
