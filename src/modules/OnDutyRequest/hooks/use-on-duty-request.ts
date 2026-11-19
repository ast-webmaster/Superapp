import { useQuery } from '@tanstack/react-query';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';

export function useOnDutyRequest(uuid: string) {
  return useQuery({
    queryKey: onDutyRequestKeys.detail(uuid),
    queryFn: ({ signal }) => onDutyRequestApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
