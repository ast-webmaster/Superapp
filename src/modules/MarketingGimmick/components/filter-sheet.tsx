import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, ChipGroup, DateRangePicker, Icon, Sheet } from '@/shared/ui';

import type { FlowConfig } from '../flows';
import { DEFAULT_FILTERS, useGimmickFilter } from '../store/marketingGimmickFilterStore';
import type { GimmickListFilters } from '../types';
import { statusLabel } from './status';
import { quickStatuses } from './status-filter';

function statusOptions(flow: FlowConfig) {
  return [
    { value: 'all', label: 'All' },
    { value: flow.awaitingStatuses, label: 'Awaiting' },
    ...flow.statuses.map((value) => ({ value, label: statusLabel(value) })),
  ];
}

/** Counts what the filter sheet (not the status chips on the toolbar) narrows the list by. */
export function countSheetFilters(flow: FlowConfig, filters: GimmickListFilters) {
  return [
    filters.dateFrom !== null || filters.dateTo !== null,
    !quickStatuses(flow).includes(filters.status),
  ].filter(Boolean).length;
}

/** "2026-11-05" -> "05/11/2026". */
const showDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : 'Select date');

export interface FilterSheetProps {
  flow: FlowConfig;
  visible: boolean;
  onClose: () => void;
}

/**
 * The list's filter form: status and date range. Edits are a draft until Apply, so the list
 * does not reload on every tap. A date range is both ends or neither, so Apply waits for the
 * second date.
 */
export function FilterSheet({ flow, visible, onClose }: FilterSheetProps) {
  const filters = useGimmickFilter((state) => state.filters[flow.flow]);
  const setFilters = useGimmickFilter((state) => state.setFilters);
  const [draft, setDraft] = useState<GimmickListFilters>(filters);
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
    setFilters(flow.flow, draft);
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
          options={statusOptions(flow)}
          value={draft.status}
          onChange={(status) => setDraft((d) => ({ ...d, status }))}
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
        {halfRange ? (
          <AppText variant="caption" tone="muted">
            Choose the last day too, or clear the dates.
          </AppText>
        ) : null}
      </View>
    </Sheet>
  );
}
