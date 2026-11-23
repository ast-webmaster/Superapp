import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';
import type { AnalyticsPeriod } from '../types';

/** Read-only figures the server computes, so the default 60 s `staleTime` applies. */
export function useRequestDesignAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: requestDesignKeys.analytics(period),
    queryFn: ({ signal }) => requestDesignApi.analytics(period, signal),
    // While another month loads, the previous one stays on screen instead of the skeleton.
    placeholderData: keepPreviousData,
  });
}
