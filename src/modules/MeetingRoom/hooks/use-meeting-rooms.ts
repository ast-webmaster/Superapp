import { useQuery } from '@tanstack/react-query';

import { meetingRoomApi } from '../api/meetingRoomApi';
import { meetingRoomKeys } from '../api/meetingRoomKeys';

/**
 * The rooms with their bookings on one day. Always asked again when a screen opens: whether a slot
 * is free is the one thing here that changes under the user's feet, and a booking made on the web
 * must show. The cached day shows meanwhile.
 */
export function useMeetingRooms(date: string) {
  return useQuery({
    queryKey: meetingRoomKeys.list(date),
    queryFn: ({ signal }) => meetingRoomApi.list(date, signal),
    staleTime: 0,
  });
}
