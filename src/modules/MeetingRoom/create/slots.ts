import type { MeetingRoomBookingSummary } from '../types';

/** "10:00 - 10:30" -> ["10:00", "10:30"]. */
function bounds(slot: string): [string, string] {
  const [start = '', end = ''] = slot.split(' - ');
  return [start, end];
}

export function slotStart(slot: string): string {
  return bounds(slot)[0];
}

/** Slots that start before noon, then the rest of the day. A part with no slots is left out. */
export function slotsByPartOfDay(
  slots: readonly string[],
): { label: string; slots: string[] }[] {
  const morning = slots.filter((slot) => slotStart(slot) < '12:00');
  const rest = slots.filter((slot) => slotStart(slot) >= '12:00');
  return [
    { label: 'Pagi', slots: morning },
    { label: 'Siang & sore', slots: rest },
  ].filter((part) => part.slots.length > 0);
}

/** The slot overlaps a booking. HH:MM strings compare correctly as text. */
export function isSlotTaken(
  slot: string,
  bookings: readonly Pick<MeetingRoomBookingSummary, 'start_time' | 'end_time'>[],
): boolean {
  const [start, end] = bounds(slot);
  return bookings.some((booking) => start < booking.end_time && end > booking.start_time);
}

/** Every slot of `all` that a booking already covers. */
export function takenSlots(
  all: readonly string[],
  bookings: readonly Pick<MeetingRoomBookingSummary, 'start_time' | 'end_time'>[],
): Set<string> {
  return new Set(all.filter((slot) => isSlotTaken(slot, bookings)));
}

/**
 * The selection after a tap. A booking is one unbroken run of slots, so a tap next to the run
 * grows it, a tap on its first or last slot shrinks it, and any other tap starts a new run.
 */
export function toggleSlot(
  selected: readonly string[],
  slot: string,
  all: readonly string[],
): string[] {
  const index = all.indexOf(slot);
  if (index === -1) return [...selected];

  const indexes = selected.map((item) => all.indexOf(item)).sort((a, b) => a - b);
  const first = indexes[0];
  const last = indexes[indexes.length - 1];
  if (first === undefined || last === undefined) return [slot];

  if (indexes.includes(index)) {
    if (indexes.length === 1) return [];
    return index === first || index === last
      ? indexes.filter((item) => item !== index).map((item) => all[item] as string)
      : [slot];
  }
  if (index === first - 1 || index === last + 1) {
    return [...indexes, index].sort((a, b) => a - b).map((item) => all[item] as string);
  }
  return [slot];
}

/** True when the slots are known and each one follows the one before it. */
export function isConsecutive(selected: readonly string[], all: readonly string[]): boolean {
  const indexes = selected.map((slot) => all.indexOf(slot)).sort((a, b) => a - b);
  return indexes.every(
    (item, position) =>
      item !== -1 && (position === 0 || item === (indexes[position - 1] ?? 0) + 1),
  );
}

/** ["10:00 - 10:30", "10:30 - 11:00"] -> "10:00 - 11:00". Empty when nothing is selected. */
export function rangeLabel(selected: readonly string[], all: readonly string[]): string {
  const ordered = [...selected].sort((a, b) => all.indexOf(a) - all.indexOf(b));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return first && last ? `${slotStart(first)} - ${bounds(last)[1]}` : '';
}

/** 1 -> "30 min", 2 -> "1 hour", 3 -> "1 h 30 min". */
export function durationLabel(count: number): string {
  const minutes = count * 30;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours} h ${rest} min`;
}
