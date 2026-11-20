import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, Button, ChipGroup, Loading, Sheet } from '@/shared/ui';
import { formatMonth } from '@/shared/utils/format';

import { useReportPeriods } from '../hooks/use-report-periods';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';

/** `ChipGroup` values are strings, so "the server's default" is an empty one. */
const LATEST = '';

export interface PeriodSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** Picks the month the report shows. A choice is a draft until Apply, so nothing reloads per tap. */
export function PeriodSheet({ visible, onClose }: PeriodSheetProps) {
  const period = useLaporanPenjualanPeriod((state) => state.period);
  const setPeriod = useLaporanPenjualanPeriod((state) => state.setPeriod);
  const [draft, setDraft] = useState(period ?? LATEST);
  const [wasVisible, setWasVisible] = useState(false);
  const { data, error, isPending, refetch } = useReportPeriods(visible);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(period ?? LATEST);
  }

  const apply = () => {
    setPeriod(draft === LATEST ? null : draft);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Period"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button variant="soft" className="flex-1" onPress={() => setDraft(LATEST)}>
            Reset
          </Button>
          <Button className="flex-1" onPress={apply}>
            Apply
          </Button>
        </View>
      }>
      {data ? (
        <ChipGroup
          label="Period"
          options={[
            { value: LATEST, label: 'Latest' },
            ...data.periods.map((item) => ({
              value: item.period,
              label: formatMonth(item.period),
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
        <Loading label="Loading periods" />
      ) : null}
    </Sheet>
  );
}
