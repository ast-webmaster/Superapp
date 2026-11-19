/** One booking in a room's day, as `GET /meeting-room` lists it. Field names follow the wire format. */
export type MeetingRoomBookingSummary = {
  id: number;
  title: string;
  /** HH:MM */
  start_time: string;
  /** HH:MM */
  end_time: string;
  organizer_name: string;
  /** The booking was made by the signed-in user. */
  is_owner: boolean;
};

export type MeetingRoom = {
  uuid: string;
  name: string;
  location: string | null;
  capacity: number | null;
  facilities: string[];
  /** Active bookings only (cancelled ones are left out), ordered by start time. */
  bookings: MeetingRoomBookingSummary[];
};

export type RoomsMeta = {
  /** YYYY-MM-DD, the day the bookings belong to. */
  date: string;
  /** Every slot a booking may use, such as "10:00 - 10:30". */
  slots: string[];
};

export type BookingAttendee = {
  email: string;
  /** The user's name when the email belongs to a user, else the email itself. */
  name: string;
  is_user: boolean;
};

/** Not narrowed to the three known values: show one the app does not know as it is. */
export type BookingStatus = 'BOOKED' | 'ENDED' | 'CANCELLED';

export type MeetingRoomBookingDetail = {
  id: number;
  title: string;
  description: string | null;
  /** Only filled for the room that requires it. */
  special_request: string | null;
  status: string;
  room: { uuid: string; name: string | null; location: string | null };
  /** YYYY-MM-DD */
  date: string;
  start_time: string;
  end_time: string;
  slots: string[];
  organizer: string;
  organizer_name: string;
  attendees: BookingAttendee[];
  is_owner: boolean;
  /** The server decides: the organizer or a holder of `cancel_meeting_room`, while still BOOKED. */
  can_cancel: boolean;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancel_remarks: string | null;
  created_at: string | null;
};

/** What the form sends to `POST /meeting-room`. */
export type CreateBookingBody = {
  meeting_room_uuid: string;
  start_date: string;
  time_slot: string[];
  title: string;
  description?: string;
  attendees?: string[];
  special_request?: string;
};

/** What the person fills in. Kept as typed; `create/draft.ts` turns it into the request body. */
export type BookingDraft = {
  roomUuid: string | null;
  /** YYYY-MM-DD */
  date: string;
  slots: string[];
  title: string;
  description: string;
  attendees: string[];
  specialRequest: string;
};
