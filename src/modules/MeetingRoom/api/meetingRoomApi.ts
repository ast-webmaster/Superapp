import { apiClient } from '@/core/api';

import type { CreateBookingBody, MeetingRoom, MeetingRoomBookingDetail, RoomsMeta } from '../types';

export const meetingRoomApi = {
  /** Every room with its active bookings on `date` (YYYY-MM-DD), plus the bookable slots. */
  list: async (date: string, signal?: AbortSignal) => {
    const response = await apiClient.get<MeetingRoom[], RoomsMeta>('/meeting-room', {
      query: { date },
      signal,
    });
    return { rooms: response.data, meta: response.meta };
  },

  detail: async (id: number, signal?: AbortSignal) =>
    (await apiClient.get<MeetingRoomBookingDetail>(`/meeting-room/${id}`, { signal })).data,

  /**
   * Resolves with the new booking. 422: a field is wrong, or a slot is taken, past or not
   * consecutive (`fieldErrors.time_slot`); nothing was saved.
   */
  create: async (body: CreateBookingBody) =>
    (await apiClient.post<MeetingRoomBookingDetail>('/meeting-room', body)).data,

  /** `remarks` is 6 to 1000 characters. 409: it was already cancelled or has ended. */
  cancel: async (id: number, remarks: string) =>
    (await apiClient.post<MeetingRoomBookingDetail>(`/meeting-room/${id}/cancel`, { remarks }))
      .data,
};
