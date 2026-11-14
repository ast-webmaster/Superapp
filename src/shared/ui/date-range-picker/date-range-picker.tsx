import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { focusRing } from '../focus';
import { IconButton } from '../icon-button/icon-button';
import { AppText } from '../text/text';

/** Days are `YYYY-MM-DD` strings, so they compare and sort as text and never pick up a time zone. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  /** Month shown first. Defaults to the month of `value.from`, else this month. */
  initialMonth?: string;
  /** Longest range allowed, both ends counted. Days past it are disabled once a start is chosen. */
  maxDays?: number;
  className?: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const toDay = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

/** The last day a range starting on `from` may end on, `maxDays` counted from `from` itself. */
function lastAllowed(from: string, maxDays: number) {
  const [year = 0, month = 1, day = 1] = from.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day + maxDays - 1));
  return toDay(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
}

/** First tap sets the start, the second the end; a tap before the start moves the start. */
function pick(range: DateRange, day: string): DateRange {
  if (range.from === null || range.to !== null || day < range.from) return { from: day, to: null };
  return { from: range.from, to: day };
}

/**
 * A month calendar for choosing a range of days. Mondays first. Pick the same day twice for a
 * single day. `maxDays` caps how long the range can be. Needs no native module, so it looks the same on iOS, Android and web.
 */
export function DateRangePicker({
  value,
  onChange,
  initialMonth,
  maxDays,
  className,
}: DateRangePickerProps) {
  const [view, setView] = useState(() => {
    const start = (
      initialMonth ??
      value.from ??
      toDay(new Date().getFullYear(), new Date().getMonth(), 1)
    ).split('-');
    return { year: Number(start[0]), month: Number(start[1]) - 1 };
  });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  // getDay is Sunday-first (0); shift so Monday is column 0.
  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) =>
    i < offset || i >= offset + daysInMonth ? null : i - offset + 1,
  );

  const limit =
    maxDays !== undefined && value.from !== null && value.to === null
      ? lastAllowed(value.from, maxDays)
      : null;

  const move = (by: number) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + by, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <View className={clsx('gap-2', className)}>
      <View className="flex-row items-center justify-between">
        <IconButton size="sm" icon="chevron-left" label="Previous month" onPress={() => move(-1)} />
        <AppText variant="body-strong" role="heading" aria-live="polite">
          {`${MONTHS[view.month]} ${view.year}`}
        </AppText>
        <IconButton size="sm" icon="chevron-right" label="Next month" onPress={() => move(1)} />
      </View>
      <View className="flex-row">
        {WEEKDAYS.map((name) => (
          <View key={name} className="flex-1 items-center py-1">
            <AppText variant="caption" tone="muted">
              {name}
            </AppText>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((day, index) => {
          if (day === null) return <View key={`blank-${index}`} className="h-touch w-[14.2857%]" />;
          const iso = toDay(view.year, view.month, day);
          const isEdge = iso === value.from || iso === value.to;
          const inRange =
            value.from !== null && value.to !== null && iso > value.from && iso < value.to;
          const disabled = limit !== null && value.from !== null && iso > limit;
          return (
            <Pressable
              key={iso}
              disabled={disabled}
              role="button"
              aria-label={`${day} ${MONTHS[view.month]} ${view.year}`}
              aria-pressed={isEdge}
              aria-disabled={disabled}
              accessibilityState={{ selected: isEdge || inRange, disabled }}
              className={clsx(
                'h-touch w-[14.2857%] items-center justify-center rounded-pill',
                isEdge ? 'bg-primary' : inRange && 'bg-primary-soft',
                focusRing,
              )}
              onPress={() => onChange(pick(value, iso))}>
              <AppText variant="body" tone={isEdge ? 'on-primary' : disabled ? 'muted' : 'ink'}>
                {String(day)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
