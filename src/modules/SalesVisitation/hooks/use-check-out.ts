import { useMutation } from '@tanstack/react-query';

import { salesVisitationApi } from '../api/salesVisitationApi';
import { salesVisitationKeys } from '../api/salesVisitationKeys';
import type { CheckInput, GpsFix } from '../types';
import { useDetailWrite } from './use-detail-write';

/** Departure: the position proof and the camera photo. The server judges it again from scratch. */
export function useCheckOut(uuid: string) {
  return useDetailWrite(uuid, 'check-out', (input: CheckInput) =>
    salesVisitationApi.checkOut(uuid, input),
  );
}

/**
 * What the server would record for a check-out from this position, for the confirm step. It saves
 * nothing, so it is a mutation (a call the user triggers) and not a cached query.
 */
export function useCheckOutPreview(uuid: string) {
  return useMutation({
    mutationKey: [...salesVisitationKeys.detail(uuid), 'check-out-preview'],
    mutationFn: (fix: GpsFix | null) => salesVisitationApi.checkOutPreview(uuid, fix),
  });
}
