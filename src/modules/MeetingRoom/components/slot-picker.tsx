import { clsx } from 'clsx';
import { View } from 'react-native';

import { AppText, Chip, FieldLabel, Loading } from '@/shared/ui';

import {
  durationLabel,
  rangeLabel,
  slotsByPartOfDay,
  slotStart,
  toggleSlot,
} from '../create/slots';

const PER_ROW = 4;

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

export interface SlotPickerProps {
  /** Every slot the server offers. Empty while they load. */
  slots: readonly string[];
  /** Slots another booking covers: shown, but not selectable. */
  taken: ReadonlySet<string>;
  selected: readonly string[];
  onChange: (selected: string[]) => void;
  loading?: boolean;
  /** Why no slots are shown yet, such as "Choose a room to see its free times". */
  hint?: string;
  error?: string;
}

/** Half-hour slots of one room and day. A booking is one unbroken run of them. */
export function SlotPicker({
  slots,
  taken,
  selected,
  onChange,
  loading = false,
  hint,
  error,
}: SlotPickerProps) {
  return (
    <View className="gap-2">
      <FieldLabel required>Time</FieldLabel>
      {loading ? (
        <Loading label="Loading free times" />
      ) : hint || slots.length === 0 ? (
        <AppText variant="caption" tone="muted">
          {hint ?? 'No times are available.'}
        </AppText>
      ) : (
        <>
          <AppText variant="caption" tone="muted">
            Tap the start, then the following slots. Grey slots are already booked.
          </AppText>
          {slotsByPartOfDay(slots).map((part) => (
            <View key={part.label} role="group" aria-label={part.label} className="gap-2">
              <AppText variant="caption-strong" tone="muted">
                {part.label}
              </AppText>
              {chunk(part.slots, PER_ROW).map((row) => (
                <View key={row[0]} className="flex-row gap-2">
                  {Array.from({ length: PER_ROW }, (_, column) => {
                    const slot = row[column];
                    // An empty cell keeps the last row's chips as wide as the rows above.
                    if (slot === undefined) return <View key={column} className="flex-1" />;
                    const isTaken = taken.has(slot);
                    return (
                      <Chip
                        key={slot}
                        outlined
                        compact
                        label={slotStart(slot)}
                        selected={selected.includes(slot)}
                        disabled={isTaken}
                        aria-label={isTaken ? `${slot}, already booked` : slot}
                        accessibilityState={{ selected: selected.includes(slot), disabled: isTaken }}
                        className={clsx('min-w-0 flex-1', isTaken && 'opacity-40')}
                        onPress={() => onChange(toggleSlot(selected, slot, slots))}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
          {selected.length > 0 ? (
            <AppText variant="caption-strong" tone="primary">
              {`${rangeLabel(selected, slots)} · ${durationLabel(selected.length)}`}
            </AppText>
          ) : null}
        </>
      )}
      {error ? (
        <AppText variant="caption" tone="danger" aria-live="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
