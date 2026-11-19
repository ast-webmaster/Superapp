import {
  durationLabel,
  isConsecutive,
  isSlotTaken,
  rangeLabel,
  takenSlots,
  toggleSlot,
} from './slots';

const ALL = ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30'];
const [S0, S1, S2, S3, S4] = ALL as [string, string, string, string, string];

describe('isSlotTaken / takenSlots', () => {
  const bookings = [{ start_time: '09:30', end_time: '10:30' }];

  it('marks a slot that overlaps a booking', () => {
    expect(isSlotTaken(S1, bookings)).toBe(true);
    expect(isSlotTaken(S2, bookings)).toBe(true);
  });

  it('leaves the slots that only touch it', () => {
    expect(isSlotTaken(S0, bookings)).toBe(false);
    expect(isSlotTaken(S3, bookings)).toBe(false);
  });

  it('lists every taken slot', () => {
    expect([...takenSlots(ALL, bookings)]).toEqual([S1, S2]);
  });
});

describe('toggleSlot', () => {
  it('starts a selection', () => {
    expect(toggleSlot([], S1, ALL)).toEqual([S1]);
  });

  it('grows the run on either side', () => {
    expect(toggleSlot([S1], S2, ALL)).toEqual([S1, S2]);
    expect(toggleSlot([S1, S2], S0, ALL)).toEqual([S0, S1, S2]);
  });

  it('starts over when the tap is not next to the run', () => {
    expect(toggleSlot([S0], S3, ALL)).toEqual([S3]);
  });

  it('shrinks from an end', () => {
    expect(toggleSlot([S0, S1, S2], S2, ALL)).toEqual([S0, S1]);
    expect(toggleSlot([S0, S1, S2], S0, ALL)).toEqual([S1, S2]);
  });

  it('starts over when a middle slot is tapped', () => {
    expect(toggleSlot([S0, S1, S2], S1, ALL)).toEqual([S1]);
  });

  it('clears a single slot', () => {
    expect(toggleSlot([S2], S2, ALL)).toEqual([]);
  });

  it('ignores a slot the server does not offer', () => {
    expect(toggleSlot([S0], '23:00 - 23:30', ALL)).toEqual([S0]);
  });
});

describe('isConsecutive', () => {
  it('accepts a run and rejects a gap or an unknown slot', () => {
    expect(isConsecutive([S1, S2, S3], ALL)).toBe(true);
    expect(isConsecutive([S0, S2], ALL)).toBe(false);
    expect(isConsecutive([S0, 'x'], ALL)).toBe(false);
  });
});

describe('labels', () => {
  it('joins the run into one range', () => {
    expect(rangeLabel([S3, S2], ALL)).toBe('10:00 - 11:00');
    expect(rangeLabel([], ALL)).toBe('');
    expect(rangeLabel([S4], ALL)).toBe('11:00 - 11:30');
  });

  it('describes the length', () => {
    expect(durationLabel(1)).toBe('30 min');
    expect(durationLabel(2)).toBe('1 hour');
    expect(durationLabel(3)).toBe('1 h 30 min');
    expect(durationLabel(4)).toBe('2 hours');
  });
});
