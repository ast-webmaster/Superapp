import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Chip } from '@/shared/ui';
import { formatMonth } from '@/shared/utils/format';

import { useReportPeriods } from '../hooks/use-report-periods';
import { useLaporanPenjualanPeriod } from '../store/laporanPenjualanPeriodStore';
import { PeriodSheet } from './period-sheet';

/** How many months show as chips; older ones open from the last chip. */
export const RECENT_PERIODS = 4;

export interface PeriodChipsProps {
  /** The period on screen (`YYYY-MM`), for the fallback chip while the list is not available. */
  currentPeriod?: string;
}

/**
 * The latest months with sales as chips: one tap switches the report. Months older than these
 * open the period sheet from the last chip. If the list cannot be loaded, one chip with the
 * period on screen opens the sheet, which has the retry.
 */
export function PeriodChips({ currentPeriod }: PeriodChipsProps) {
  const currentLabel = currentPeriod ? formatMonth(currentPeriod) : undefined;
  const period = useLaporanPenjualanPeriod((state) => state.period);
  const setPeriod = useLaporanPenjualanPeriod((state) => state.setPeriod);
  const [choosing, setChoosing] = useState(false);
  const { data } = useReportPeriods();

  // `YYYY-MM` sorts as text, so the newest month is first whatever order the server sent.
  const sorted = data ? [...data.periods].sort((a, b) => b.period.localeCompare(a.period)) : [];
  const recent = sorted.slice(0, RECENT_PERIODS);
  // The server's default is the latest month, which the store keeps as `null`.
  const selected = period ?? data?.default;
  const older = sorted.find((item) => item.period === selected && !recent.includes(item));

  return (
    <>
      <PeriodSheet visible={choosing} onClose={() => setChoosing(false)} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        role="group"
        aria-label="Period"
        contentContainerClassName="items-center gap-3 px-5">
        {recent.length > 0 ? (
          <>
            {recent.map((item) => (
              <Chip
                key={item.period}
                label={formatMonth(item.period)}
                selected={item.period === selected}
                aria-label={`Period, ${formatMonth(item.period)}`}
                onPress={() => setPeriod(item.period === data?.default ? null : item.period)}
              />
            ))}
            {sorted.length > recent.length ? (
              <Chip
                icon="calendar"
                label={older ? formatMonth(older.period) : 'More'}
                selected={older !== undefined}
                aria-label={
                  older ? `Period, ${formatMonth(older.period)}. Change period` : 'More periods'
                }
                onPress={() => setChoosing(true)}
              />
            ) : null}
          </>
        ) : (
          <Chip
            icon="calendar"
            label={currentLabel ?? 'Latest'}
            selected
            aria-label={`Period, ${currentLabel ?? 'latest'}. Change period`}
            onPress={() => setChoosing(true)}
          />
        )}
      </ScrollView>
    </>
  );
}
