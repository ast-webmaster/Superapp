/**
 * Every React Query key of this module. The first segment is the manifest id, so no other
 * module can collide with it, and `all` / `lists()` / `details()` invalidate a whole family.
 */
export const meetingRoomKeys = {
  all: ['meeting-room'] as const,
  /** One entry per day: the rooms with their bookings on that day. */
  lists: () => [...meetingRoomKeys.all, 'list'] as const,
  list: (date: string) => [...meetingRoomKeys.lists(), date] as const,
  details: () => [...meetingRoomKeys.all, 'detail'] as const,
  detail: (id: number) => [...meetingRoomKeys.details(), id] as const,
};
