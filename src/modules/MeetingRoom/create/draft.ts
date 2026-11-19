import type { FieldErrors } from '@/core/errors';

import type { BookingDraft, CreateBookingBody } from '../types';
import { isConsecutive } from './slots';

/** The one room that needs a special request (the server enforces it by this name). */
export const SPECIAL_REQUEST_ROOM = 'LANTAI 5';

export const TITLE_MAX = 191;
export const DESCRIPTION_MAX = 5000;
export const ATTENDEES_MAX = 100;

export type BookingField =
  'room' | 'date' | 'slots' | 'title' | 'description' | 'attendees' | 'specialRequest';
export type Errors = Partial<Record<BookingField, string>>;

export const emptyDraft: BookingDraft = {
  roomUuid: null,
  date: '',
  slots: [],
  title: '',
  description: '',
  attendees: [],
  specialRequest: '',
};

export function needsSpecialRequest(roomName: string | null | undefined): boolean {
  return roomName === SPECIAL_REQUEST_ROOM;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return EMAIL.test(value) && value.length <= 191;
}

export type DraftContext = {
  roomName: string | null;
  /** Every slot the server offers. */
  allSlots: readonly string[];
  /** Slots of the chosen room that another booking covers. */
  taken: ReadonlySet<string>;
};

/** What is wrong with the draft, before anything is sent. The server checks everything again. */
export function validateDraft(draft: BookingDraft, context: DraftContext): Errors {
  const errors: Errors = {};

  if (!draft.roomUuid) errors.room = 'Choose a room.';
  if (!draft.date) errors.date = 'Choose a date.';

  if (draft.slots.length === 0) {
    errors.slots = 'Choose at least one time slot.';
  } else if (draft.slots.some((slot) => context.taken.has(slot))) {
    errors.slots = 'A slot you chose is no longer free. Choose again.';
  } else if (!isConsecutive(draft.slots, context.allSlots)) {
    errors.slots = 'Choose slots that follow each other.';
  }

  const title = draft.title.trim();
  if (!title) errors.title = 'Enter a title.';
  else if (title.length > TITLE_MAX) errors.title = `Use at most ${TITLE_MAX} characters.`;

  if (draft.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Use at most ${DESCRIPTION_MAX} characters.`;
  }
  if (draft.attendees.length > ATTENDEES_MAX) {
    errors.attendees = `Invite at most ${ATTENDEES_MAX} people.`;
  }
  if (needsSpecialRequest(context.roomName) && !draft.specialRequest.trim()) {
    errors.specialRequest = 'This room needs a special request, such as catering or seating.';
  }

  return errors;
}

/** Why an attendee email cannot be added, or null when it can. */
export function attendeeError(value: string, existing: readonly string[]): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Enter an email address.';
  if (!isEmail(email)) return `"${value.trim()}" is not a valid email.`;
  if (existing.includes(email)) return 'This person is already invited.';
  return null;
}

/** The request body. Empty optional fields are left out. */
export function toRequestBody(draft: BookingDraft, roomName: string | null): CreateBookingBody {
  const description = draft.description.trim();
  const specialRequest = draft.specialRequest.trim();

  return {
    meeting_room_uuid: draft.roomUuid ?? '',
    start_date: draft.date,
    time_slot: draft.slots,
    title: draft.title.trim(),
    ...(description ? { description } : {}),
    ...(draft.attendees.length > 0 ? { attendees: draft.attendees } : {}),
    ...(needsSpecialRequest(roomName) && specialRequest ? { special_request: specialRequest } : {}),
  };
}

const SERVER_FIELDS: Record<string, BookingField> = {
  meeting_room_uuid: 'room',
  start_date: 'date',
  time_slot: 'slots',
  title: 'title',
  description: 'description',
  attendees: 'attendees',
  special_request: 'specialRequest',
};

/** The server's 422 field errors, on the fields of this form (`attendees.2` lands on `attendees`). */
export function errorsFromServer(fieldErrors: FieldErrors | undefined): Errors {
  const errors: Errors = {};
  for (const [name, messages] of Object.entries(fieldErrors ?? {})) {
    const field =
      SERVER_FIELDS[name.split('.')[0] ?? ''] ?? (name.startsWith('time_slot') ? 'slots' : null);
    const message = messages[0];
    if (field && message && !errors[field]) errors[field] = message;
  }
  return errors;
}

/** Whether the person typed anything worth asking about before leaving. */
export function isDirty(draft: BookingDraft): boolean {
  return (
    draft.slots.length > 0 ||
    draft.title.trim() !== '' ||
    draft.description.trim() !== '' ||
    draft.attendees.length > 0 ||
    draft.specialRequest.trim() !== ''
  );
}
