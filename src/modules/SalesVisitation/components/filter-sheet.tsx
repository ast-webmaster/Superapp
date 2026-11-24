import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, ChipGroup, DateRangePicker, Icon, Sheet } from '@/shared/ui';

import { DEFAULT_FILTERS, useSalesVisitationFilter } from '../store/salesVisitationFilterStore';
import type { SalesVisitationListFilters } from '../types';
import { STATUSES, statusLabel } from './status';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...STATUSES.map((value) => ({ value, label: statusLabel(value) })),
];

/** Counts what the filter sheet narrows the list by beyond the status chips: the date range. */
export function countSheetFilters(filters: SalesVisitationListFilters) {
  return filters.dateFrom !== null || filters.dateTo !== null ? 1 : 0;
}

/** "2026-11-05" -> "05/11/2026". */
const showDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : 'Select date');

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The list's filter form: status and the visit date range. Edits are a draft until Apply, so the
 * list does not reload on every tap. A date range is both ends or neither, so Apply waits for the
 * second date.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const filters = useSalesVisitationFilter((state) => state.filters);
  const setFilters = useSalesVisitationFilter((state) => state.setFilters);
  const [draft, setDraft] = useState<SalesVisitationListFilters>(filters);
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

  const halfRange = (draft.dateFrom === null) !== (draft.dateTo === null);

  const apply = () => {
    setFilters(draft);
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
          <Button variant="soft" className="flex-1" onPress={() => setDraft(DEFAULT_FILTERS)}>
            Reset
          </Button>
          <Button className="flex-1" disabled={halfRange} onPress={apply}>
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
        <AppText variant="body-strong">Visit date</AppText>
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
        {halfRange ? (
          <AppText variant="caption" tone="muted">
            Choose the last day too, or clear the dates.
          </AppText>
        ) : null}
      </View>
    </Sheet>
  );
}
