import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/shared/hooks/use-theme';

export function Loading() {
  const theme = useTheme();

  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <ActivityIndicator color={theme.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
