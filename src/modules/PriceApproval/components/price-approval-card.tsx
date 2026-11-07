import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { Spacing } from '@/shared/theme';

import type { PriceApprovalListItem } from '../types';

export function PriceApprovalCard({ item }: { item: PriceApprovalListItem }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <ThemedText type="smallBold">{item.pa_no}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.status}
        </ThemedText>
      </View>
      <ThemedText>{item.customer_name ?? item.customer_id ?? '-'}</ThemedText>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          {item.request_by_name ?? item.request_by}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.last_updated_tier ? `${item.last_updated_tier} · ` : ''}
          {item.pa_date}
        </ThemedText>
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
