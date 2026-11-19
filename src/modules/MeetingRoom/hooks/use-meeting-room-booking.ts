import { useQuery } from '@tanstack/react-query';

import { meetingRoomApi } from '../api/meetingRoomApi';
import { meetingRoomKeys } from '../api/meetingRoomKeys';

export function useMeetingRoomBooking(id: number) {
  return useQuery({
    queryKey: meetingRoomKeys.detail(id),
    queryFn: ({ signal }) => meetingRoomApi.detail(id, signal),
    // Whether it can still be cancelled depends on the clock and the status, so opening the screen
    // always asks the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
