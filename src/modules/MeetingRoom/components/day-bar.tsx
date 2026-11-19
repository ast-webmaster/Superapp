import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Button, focusRing, IconButton, Icon } from '@/shared/ui';
import { formatWeekdayDate } from '@/shared/utils/format';

import { addDays, parseIsoDay, todayIso } from '../create/dates';
import { DaySheet } from './day-sheet';

export interface DayBarProps {
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
}

/** Previous day, the day (opens a calendar), next day, and a way back to today. */
export function DayBar({ value, onChange }: DayBarProps) {
  const [open, setOpen] = useState(false);
  const today = todayIso();
  const label = `${formatWeekdayDate(parseIsoDay(value))}${value === today ? ' · Today' : ''}`;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2 px-5">
        <IconButton
          size="sm"
          icon="chevron-left"
          label="Previous day"
          onPress={() => onChange(addDays(value, -1))}
        />
        <Pressable
          role="button"
          aria-label={`${label}. Choose another date`}
          onPress={() => setOpen(true)}
          className={clsx(
            'min-h-touch flex-1 flex-row items-center justify-center gap-2 rounded-pill border border-border bg-surface px-4',
            'active:bg-surface-gray',
            focusRing,
          )}>
          <Icon name="calendar" color="ink" />
          <AppText numberOfLines={1}>{label}</AppText>
        </Pressable>
        <IconButton
          size="sm"
          icon="chevron-right"
          label="Next day"
          onPress={() => onChange(addDays(value, 1))}
        />
      </View>
      {value !== today ? (
        <View className="items-center">
          <Button size="sm" variant="soft" onPress={() => onChange(today)}>
            Back to today
          </Button>
        </View>
      ) : null}
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
