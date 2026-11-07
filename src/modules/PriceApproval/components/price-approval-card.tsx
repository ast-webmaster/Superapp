import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { Spacing } from '@/shared/theme';

import type { PriceApproval } from '../types';

export function PriceApprovalCard({ item }: { item: PriceApproval }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <ThemedText type="smallBold">{item.code}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.status}
        </ThemedText>
      </View>
      <ThemedText>{item.itemName}</ThemedText>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          {item.requestedBy}
        </ThemedText>
        <ThemedText type="smallBold">{item.requestedPrice.toLocaleString('id-ID')}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
