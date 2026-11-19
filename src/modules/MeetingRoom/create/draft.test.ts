import type { BookingDraft } from '../types';
import {
  attendeeError,
  emptyDraft,
  errorsFromServer,
  isDirty,
  toRequestBody,
  validateDraft,
  type DraftContext,
} from './draft';

const ALL = ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00'];
const context: DraftContext = { roomName: 'RUANG A', allSlots: ALL, taken: new Set() };

function draft(patch: Partial<BookingDraft> = {}): BookingDraft {
  return {
    ...emptyDraft,
    roomUuid: 'room-1',
    date: '2026-11-24',
    slots: ['10:00 - 10:30', '10:30 - 11:00'],
    title: 'Monthly target',
    ...patch,
  };
}

describe('validateDraft', () => {
  it('accepts a complete draft', () => {
    expect(validateDraft(draft(), context)).toEqual({});
  });

  it('asks for the room, the slots and the title', () => {
    const errors = validateDraft(draft({ roomUuid: null, slots: [], title: '  ' }), context);
    expect(Object.keys(errors).sort()).toEqual(['room', 'slots', 'title']);
  });

  it('rejects slots with a gap', () => {
    const errors = validateDraft(draft({ slots: ['09:00 - 09:30', '10:00 - 10:30'] }), context);
    expect(errors.slots).toMatch(/follow each other/);
  });

  it('rejects a slot that was taken meanwhile', () => {
    const taken = new Set(['10:30 - 11:00']);
    expect(validateDraft(draft(), { ...context, taken }).slots).toMatch(/no longer free/);
  });

  it('wants a special request only for the room that needs one', () => {
    const lantai = { ...context, roomName: 'LANTAI 5' };
    expect(validateDraft(draft(), lantai).specialRequest).toBeDefined();
    expect(validateDraft(draft({ specialRequest: 'Catering' }), lantai)).toEqual({});
    expect(validateDraft(draft(), context).specialRequest).toBeUndefined();
  });
});

describe('attendeeError', () => {
  it('accepts a new address in any case', () => {
    expect(attendeeError(' New@Example.com ', [])).toBeNull();
  });

  it('rejects empty, malformed and repeated addresses', () => {
    expect(attendeeError('  ', [])).toMatch(/Enter/);
    expect(attendeeError('nope', [])).toMatch(/not a valid/);
    expect(attendeeError('A@b.co', ['a@b.co'])).toMatch(/already/);
  });
});

describe('toRequestBody', () => {
  it('sends only what is filled in', () => {
    expect(toRequestBody(draft(), 'RUANG A')).toEqual({
      meeting_room_uuid: 'room-1',
      start_date: '2026-11-24',
      time_slot: ['10:00 - 10:30', '10:30 - 11:00'],
      title: 'Monthly target',
    });
  });

  it('adds the optional fields, and the special request only for its room', () => {
    const full = draft({
      description: ' Agenda ',
      attendees: ['a@b.co'],
      specialRequest: ' Catering ',
    });
    expect(toRequestBody(full, 'LANTAI 5')).toMatchObject({
      description: 'Agenda',
      attendees: ['a@b.co'],
      special_request: 'Catering',
    });
    expect(toRequestBody(full, 'RUANG A')).not.toHaveProperty('special_request');
  });
});

describe('errorsFromServer', () => {
  it('maps the server fields to the form fields', () => {
    expect(
      errorsFromServer({
        time_slot: ['Selected time slot is already booked.'],
        'attendees.1': ['Email peserta "x" tidak valid.'],
        title: ['Required'],
        unknown: ['ignored'],
      }),
    ).toEqual({
      slots: 'Selected time slot is already booked.',
      attendees: 'Email peserta "x" tidak valid.',
      title: 'Required',
    });
  });

  it('copes with no errors', () => {
    expect(errorsFromServer(undefined)).toEqual({});
  });
});

describe('isDirty', () => {
  it('is false for a draft that only chose a room and a day', () => {
    expect(isDirty(draft({ slots: [], title: '' }))).toBe(false);
    expect(isDirty(draft())).toBe(true);
  });
});
