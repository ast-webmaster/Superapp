import { useQuery } from '@tanstack/react-query';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';

export function useRequestDesign(uuid: string) {
  return useQuery({
    queryKey: requestDesignKeys.detail(uuid),
    queryFn: ({ signal }) => requestDesignApi.detail(uuid, signal),
    // The actions offered depend on the current status, so opening the screen always asks
    // the server again. The cached copy shows meanwhile.
    staleTime: 0,
  });
}
