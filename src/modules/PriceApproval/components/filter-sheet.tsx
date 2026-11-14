import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, ChipGroup, DateRangePicker, Icon, Sheet, TextField } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import { DEFAULT_FILTERS, usePriceApprovalFilter } from '../store/priceApprovalFilterStore';
import type { PriceApprovalListFilters, PriceApprovalTier } from '../types';
import { statusLabels } from './status';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

const TIERS: PriceApprovalTier[] = [
  'SALES',
  'PRODUCT MANAGER',
  'SALES ADMIN',
  'FINANCE',
  'ACCOUNTING',
];
const TIER_OPTIONS = [
  { value: 'all', label: 'All' },
  ...TIERS.map((tier) => ({ value: tier, label: sentenceCase(tier) })),
];

/** "2026-11-05" -> "05/11/2026". */
const showDate = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : 'Select date');

const digits = (value: string) => value.replace(/\D/g, '');
const toAmount = (value: string) => (value === '' ? null : Number(value));

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The list's filter form: status, last updated tier, date range and grand total. Edits are a
 * draft until Apply, so the list does not reload on every tap.
 */
export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const filters = usePriceApprovalFilter((state) => state.filters);
  const setFilters = usePriceApprovalFilter((state) => state.setFilters);
  const [draft, setDraft] = useState<PriceApprovalListFilters>(filters);
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);

  // Each time the sheet opens it starts from what is applied now, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(filters);
      setMin(filters.minTotal?.toString() ?? '');
      setMax(filters.maxTotal?.toString() ?? '');
      setCalendarOpen(false);
    }
  }

  const totalError =
    min !== '' && max !== '' && Number(min) > Number(max)
      ? 'Max must be at least the min.'
      : undefined;

  const reset = () => {
    setDraft(DEFAULT_FILTERS);
    setMin('');
    setMax('');
  };

  const apply = () => {
    setFilters({ ...draft, minTotal: toAmount(min), maxTotal: toAmount(max) });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Filter"
      onClose={onClose}
      footer={
        <View className="flex-row gap-3">
          <Button variant="soft" className="flex-1" onPress={reset}>
            Reset
          </Button>
          <Button className="flex-1" disabled={Boolean(totalError)} onPress={apply}>
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
            setDraft((d) => ({ ...d, status: status as PriceApprovalListFilters['status'] }))
          }
        />
      </View>

      <View className="gap-3">
        <AppText variant="body-strong">Last updated tier</AppText>
        <ChipGroup
          label="Last updated tier"
          options={TIER_OPTIONS}
          value={draft.tier}
          onChange={(tier) =>
            setDraft((d) => ({ ...d, tier: tier as PriceApprovalListFilters['tier'] }))
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

      <View className="gap-3">
        <AppText variant="body-strong">Grand total</AppText>
        <View className="flex-row items-start gap-3">
          <TextField
            label="Min"
            className="min-w-0 flex-1"
            keyboardType="number-pad"
            placeholder="0"
            value={min}
            onChangeText={(text) => setMin(digits(text))}
          />
          <TextField
            label="Max"
            className="min-w-0 flex-1"
            keyboardType="number-pad"
            placeholder="No limit"
            value={max}
            onChangeText={(text) => setMax(digits(text))}
            error={totalError}
          />
        </View>
        <AppText variant="caption" tone="muted">
          In rupiah. Leave a field empty for no limit.
        </AppText>
      </View>
    </Sheet>
  );
}
