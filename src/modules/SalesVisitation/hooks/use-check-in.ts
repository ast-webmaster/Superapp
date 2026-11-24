import { salesVisitationApi } from '../api/salesVisitationApi';
import type { CheckInput } from '../types';
import { useDetailWrite } from './use-detail-write';

/** Arrival: the position proof and the camera photo, judged by the server. */
export function useCheckIn(uuid: string) {
  return useDetailWrite(uuid, 'check-in', (input: CheckInput) =>
    salesVisitationApi.checkIn(uuid, input),
  );
}
