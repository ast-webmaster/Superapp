import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, ChipGroup, DateRangePicker, Icon, Sheet } from '@/shared/ui';

import { DEFAULT_FILTERS, useOnDutyRequestFilter } from '../store/onDutyRequestFilterStore';
import type { OnDutyRequestListFilters } from '../types';
import { statusLabels } from './status';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

/** "2026-11-05" -> "05/11/2026". */
const showDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : 'Select date');

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The list's filter form: status and date range. Edits are a draft until Apply, so the list
 * does not reload on every tap.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const filters = useOnDutyRequestFilter((state) => state.filters);
  const setFilters = useOnDutyRequestFilter((state) => state.setFilters);
  const [draft, setDraft] = useState<OnDutyRequestListFilters>(filters);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(filters);
      setCalendarOpen(false);
    }
  }

  const apply = () => {
    setFilters(draft);
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Filter"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button variant="soft" className="flex-1" onPress={() => setDraft(DEFAULT_FILTERS)}>
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
          onChange={(status) =>
            setDraft((d) => ({ ...d, status: status as OnDutyRequestListFilters['status'] }))
          }
        />
      </View>

      <View className="gap-3">
        <AppText variant="body-strong">Date</AppText>
        <View className="flex-row overflow-hidden rounded-lg border border-border">
          {(['From', 'To'] as const).map((side, index) => {
            const value = side === 'From' ? draft.dateFrom : draft.dateTo;
            return (
              <Pressable
                key={side}
                role="button"
                aria-label={`${side} date, ${showDate(value)}`}
                aria-expanded={calendarOpen}
                className={clsx(
                  'min-h-control flex-1 flex-row items-center gap-3 px-4 py-2 active:bg-border',
                  index === 1 && 'border-l border-border',
                )}
                onPress={() => setCalendarOpen((open) => !open)}>
                <Icon name="calendar" color="ink" />
                <View>
                  <AppText variant="caption" tone="muted">
                    {side}
                  </AppText>
                  <AppText variant="body-strong">{showDate(value)}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
        {calendarOpen ? (
          <DateRangePicker
            value={{ from: draft.dateFrom, to: draft.dateTo }}
            onChange={({ from, to }) => setDraft((d) => ({ ...d, dateFrom: from, dateTo: to }))}
          />
        ) : null}
      </View>
    </Sheet>
  );
}
