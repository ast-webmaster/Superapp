import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, ChipGroup, Sheet } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import { DEFAULT_FILTERS, useAuditFilter } from '../store/auditFilterStore';
import type { AuditListFilters } from '../types';
import { AUDIT_STATUSES } from './status';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...AUDIT_STATUSES.map((status) => ({ value: status, label: sentenceCase(status) })),
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_OPTIONS = [
  { value: 'all', label: 'All' },
  ...MONTHS.map((label, index) => ({ value: String(index + 1), label })),
];

/** Last year, this year and next year: the schedule is planned a year at a time. */
function yearOptions() {
  const year = new Date().getFullYear();
  return [
    { value: 'all', label: 'All' },
    ...[year - 1, year, year + 1].map((value) => ({ value: String(value), label: String(value) })),
  ];
}

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The list's filter form: status and the month the activity starts in. Edits are a draft until
 * Apply, so the list does not reload on every tap. A month needs a year, so it shows only after one.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const filters = useAuditFilter((state) => state.filters);
  const setFilters = useAuditFilter((state) => state.setFilters);
  const [draft, setDraft] = useState<AuditListFilters>(filters);
  const [wasVisible, setWasVisible] = useState(false);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  const apply = () => {
    setFilters({
      status: draft.status,
      year: draft.year,
      month: draft.year === null ? null : draft.month,
    });
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
            onPress={() =>
              setDraft((d) => ({
                ...d,
                status: DEFAULT_FILTERS.status,
                year: DEFAULT_FILTERS.year,
                month: DEFAULT_FILTERS.month,
              }))
            }>
            Reset
          </Button>
          <Button className="flex-1" onPress={apply}>
            Apply
          </Button>
        </View>
      }>
      <View className="gap-3">
        <AppText variant="body-strong">Status</AppText>
        <ChipGroup
          label="Status"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(status) => setDraft((d) => ({ ...d, status }))}
        />
      </View>

      <View className="gap-3">
        <AppText variant="body-strong">Activity year</AppText>
        <ChipGroup
          label="Activity year"
          options={yearOptions()}
          value={draft.year === null ? 'all' : String(draft.year)}
          onChange={(year) =>
            setDraft((d) =>
              year === 'all' ? { ...d, year: null, month: null } : { ...d, year: Number(year) },
            )
          }
        />
      </View>

      {draft.year !== null ? (
        <View className="gap-3">
          <AppText variant="body-strong">Activity month</AppText>
          <ChipGroup
            label="Activity month"
            options={MONTH_OPTIONS}
            value={draft.month === null ? 'all' : String(draft.month)}
            onChange={(month) =>
              setDraft((d) => ({ ...d, month: month === 'all' ? null : Number(month) }))
            }
          />
        </View>
      ) : null}
    </Sheet>
  );
}
