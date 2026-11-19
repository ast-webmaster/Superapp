// Route paths this module owns. The matching files live in src/app/(app)/meeting-room/.
export const meetingRoomRoutes = {
  list: '/meeting-room',
  /** `room` (uuid) and `date` (YYYY-MM-DD) start the form on that room and day. */
  create: (params: { room?: string; date?: string } = {}) => {
    const query = Object.entries(params)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    return query ? `/meeting-room/new?${query}` : '/meeting-room/new';
  },
  detail: (id: number) => `/meeting-room/${id}`,
} as const;
