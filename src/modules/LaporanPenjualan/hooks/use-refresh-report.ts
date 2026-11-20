import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { laporanPenjualanKeys } from '../api/laporanPenjualanKeys';

/**
 * Loads the report again on demand: the "Update data" action. It covers the whole module family
 * (summary, groups and periods), not just what is on screen. What is on screen reloads now; a
 * group opened later is marked stale and reloads when it opens, so no screen shows a figure that
 * predates the refresh. It is the only way to get new data before the next 10:00.
 */
export function useRefreshReport() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: laporanPenjualanKeys.all });
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
}
