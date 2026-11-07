import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { Spacing } from '@/shared/theme';

import type { PriceApprovalFilter } from '../types';

const OPTIONS: { value: PriceApprovalFilter; label: string }[] = [
  { value: 'AWAITING', label: 'Awaiting' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FINISH', label: 'Finished' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'all', label: 'All' },
];

type StatusFilterProps = {
  value: PriceApprovalFilter;
  onChange: (value: PriceApprovalFilter) => void;
};

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}>
            <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
              <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                {option.label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
