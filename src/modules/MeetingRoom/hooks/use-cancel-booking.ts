import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { meetingRoomApi } from '../api/meetingRoomApi';
import { meetingRoomKeys } from '../api/meetingRoomKeys';

/**
 * Cancels one booking and frees its slots. The detail shows the server's copy once it answers,
 * never a status guessed locally. Never retried (see query-client); the server also refuses a
 * repeat with 409.
 */
export function useCancelBooking(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...meetingRoomKeys.detail(id), 'cancel'],
    mutationFn: (remarks: string) => meetingRoomApi.cancel(id, remarks),
    onSuccess: (detail) => {
      queryClient.setQueryData(meetingRoomKeys.detail(id), detail);
      // The slots are free again. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: meetingRoomKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the booking
      // changed or the cancel went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: meetingRoomKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: meetingRoomKeys.lists() });
    },
  });
}
