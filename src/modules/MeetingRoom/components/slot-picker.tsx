import { View } from 'react-native';

import { AppText, Chip, FieldLabel, Loading } from '@/shared/ui';

import { durationLabel, rangeLabel, slotStart, toggleSlot } from '../create/slots';

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
          <View role="group" aria-label="Time slots" className="flex-row flex-wrap gap-2">
            {slots.map((slot) => {
              const isTaken = taken.has(slot);
              return (
                <Chip
                  key={slot}
                  outlined
                  label={slotStart(slot)}
                  selected={selected.includes(slot)}
                  disabled={isTaken}
                  aria-label={isTaken ? `${slot}, already booked` : slot}
                  accessibilityState={{ selected: selected.includes(slot), disabled: isTaken }}
                  className={isTaken ? 'opacity-40' : undefined}
                  onPress={() => onChange(toggleSlot(selected, slot, slots))}
                />
              );
            })}
          </View>
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
