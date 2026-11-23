import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, focusRing, IconButton, Icon } from '@/shared/ui';
import { formatWeekday, formatWeekdayDate } from '@/shared/utils/format';

import { addDays, parseIsoDay, todayIso } from '../create/dates';
import { DaySheet } from './day-sheet';

export interface DayBarProps {
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
}

/** Seven YYYY-MM-DD days: the day before `value`, `value` itself second, then the next five. */
function daysAround(value: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(value, index - 1));
}

/** Seven day circles with the chosen one filled and second; the title opens a calendar for any other day. */
export function DayBar({ value, onChange }: DayBarProps) {
  const [open, setOpen] = useState(false);
  const today = todayIso();
  const label = `${formatWeekdayDate(parseIsoDay(value))}${value === today ? ' · Today' : ''}`;

  return (
    <View className="gap-3 px-5">
      <View className="flex-row items-center gap-2">
        <Pressable
          role="button"
          aria-label={`${label}. Choose another date`}
          onPress={() => setOpen(true)}
          className={clsx(
            'min-h-touch flex-1 flex-row items-center gap-2 self-start rounded-lg',
            'active:opacity-70',
            focusRing,
          )}>
          <Icon name="calendar" color="ink" />
          <AppText variant="body-strong" numberOfLines={1} className="min-w-0 shrink">
            {label}
          </AppText>
        </Pressable>
        <IconButton
          size="sm"
          icon="chevron-left"
          label="Previous week"
          onPress={() => onChange(addDays(value, -7))}
        />
        <IconButton
          size="sm"
          icon="chevron-right"
          label="Next week"
          onPress={() => onChange(addDays(value, 7))}
        />
      </View>
      <View className="flex-row">
        {daysAround(value).map((day) => {
          const date = parseIsoDay(day);
          const selected = day === value;
          return (
            <Pressable
              key={day}
              role="button"
              accessible
              aria-label={`${formatWeekdayDate(date)}${day === today ? ', today' : ''}`}
              aria-selected={selected}
              accessibilityState={{ selected }}
              onPress={() => onChange(day)}
              className={clsx('min-h-touch flex-1 px-0.5', focusRing)}>
              <View
                className={clsx(
                  'items-center gap-1 rounded-lg border py-3',
                  selected && 'border-ink bg-ink',
                  !selected && day === today && 'border-ink bg-surface',
                  !selected && day !== today && 'border-border bg-surface',
                )}>
                <AppText variant="caption" tone={selected ? 'on-ink-muted' : 'muted'}>
                  {formatWeekday(date)}
                </AppText>
                <AppText variant="body-strong" tone={selected ? 'on-primary' : 'ink'}>
                  {date.getDate()}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <DaySheet
        visible={open}
        title="Choose a date"
        value={value}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
