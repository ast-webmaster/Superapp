import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingRoomApi } from '../api/meetingRoomApi';
import { meetingRoomKeys } from '../api/meetingRoomKeys';
import type { CreateBookingBody } from '../types';

/**
 * Books a room. Nothing is shown as booked until the server answers; the detail then holds the
 * server's copy. Never retried (see query-client): after a timeout or a lost connection the
 * booking may exist, so the rooms are read again either way. A refused slot (422) refreshes them
 * too, because the slot was taken since the screen last looked.
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...meetingRoomKeys.all, 'create'],
    mutationFn: (body: CreateBookingBody) => meetingRoomApi.create(body),
    onSuccess: (detail) => {
      queryClient.setQueryData(meetingRoomKeys.detail(detail.id), detail);
      void queryClient.invalidateQueries({ queryKey: meetingRoomKeys.lists() });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: meetingRoomKeys.lists() });
    },
  });
}
