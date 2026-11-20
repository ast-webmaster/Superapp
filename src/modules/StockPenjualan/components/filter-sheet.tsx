import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, ChipGroup, Loading, Sheet } from '@/shared/ui';

import { useStockCategories } from '../hooks/use-stock-categories';
import { DEFAULT_FILTERS, useStockPenjualanFilter } from '../store/stockPenjualanFilterStore';

/** `ChipGroup` values are strings, so "every category" is an empty one. */
const ALL = '';

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** The list's filter form: category. An edit is a draft until Apply, so the list does not reload per tap. */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const categoryCode = useStockPenjualanFilter((state) => state.filters.categoryCode);
  const setFilters = useStockPenjualanFilter((state) => state.setFilters);
  const [draft, setDraft] = useState(categoryCode ?? ALL);
  const [wasVisible, setWasVisible] = useState(false);
  const { data, error, isPending, refetch } = useStockCategories(visible);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(categoryCode ?? ALL);
  }

  const apply = () => {
    setFilters({ categoryCode: draft === ALL ? null : draft });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Filter"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button
            variant="soft"
            className="flex-1"
            onPress={() => setDraft(DEFAULT_FILTERS.categoryCode ?? ALL)}>
            Reset
          </Button>
          <Button className="flex-1" onPress={apply}>
            Apply
          </Button>
        </View>
      }>
      <View className="gap-3">
        <AppText variant="body-strong">Category</AppText>
        {data ? (
          <ChipGroup
            label="Category"
            options={[
              { value: ALL, label: 'All' },
              ...data.map((category) => ({
                value: category.category_code,
                label: category.category_name,
              })),
            ]}
            value={draft}
            onChange={setDraft}
          />
        ) : error ? (
          <>
            <Alert tone="danger" message={toAppError(error).message} />
            <Button variant="soft" onPress={() => refetch()}>
              Try again
            </Button>
          </>
        ) : isPending ? (
          <Loading label="Loading categories" />
        ) : null}
      </View>
    </Sheet>
  );
}
