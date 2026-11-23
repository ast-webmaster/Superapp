import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, Loading, MultiChipGroup, Sheet } from '@/shared/ui';

import { useAnalysisFilters } from '../hooks/use-analysis';
import { useSalesInventoryAnalysisFilter } from '../store/salesInventoryAnalysisFilterStore';

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

const toOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

/**
 * Branch and brand. The server lists only those in the user's scope, and a choice can only narrow
 * it. An edit is a draft until Apply, so the analysis does not reload on every tap.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const branch = useSalesInventoryAnalysisFilter((state) => state.branch);
  const brand = useSalesInventoryAnalysisFilter((state) => state.brand);
  const setSelection = useSalesInventoryAnalysisFilter((state) => state.setSelection);
  const [draft, setDraft] = useState({ branch, brand });
  const [wasVisible, setWasVisible] = useState(false);
  const { data, error, isPending, refetch } = useAnalysisFilters(visible);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft({ branch, brand });
  }

  const apply = () => {
    setSelection(draft);
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
            onPress={() => setDraft({ branch: [], brand: [] })}>
            Reset
          </Button>
          <Button className="flex-1" onPress={apply}>
            Apply
          </Button>
        </View>
      }>
      {data ? (
        <View className="gap-6">
          {data.branches.length > 0 ? (
            <View className="gap-3">
              <AppText variant="body-strong">Branch</AppText>
              <MultiChipGroup
                label="Branch"
                allLabel="All branches"
                options={toOptions(data.branches)}
                values={draft.branch}
                onChange={(values) => setDraft((current) => ({ ...current, branch: values }))}
              />
            </View>
          ) : null}
          {data.brands.length > 0 ? (
            <View className="gap-3">
              <AppText variant="body-strong">Brand</AppText>
              <MultiChipGroup
                label="Brand"
                allLabel="All brands"
                options={toOptions(data.brands)}
                values={draft.brand}
                onChange={(values) => setDraft((current) => ({ ...current, brand: values }))}
              />
            </View>
          ) : null}
        </View>
      ) : error ? (
        <View className="gap-3">
          <Alert tone="danger" message={toAppError(error).message} />
          <Button variant="soft" onPress={() => refetch()}>
            Try again
          </Button>
        </View>
      ) : isPending ? (
        <Loading label="Loading filters" />
      ) : null}
    </Sheet>
  );
}
