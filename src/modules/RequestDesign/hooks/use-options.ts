import { useQuery } from '@tanstack/react-query';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';

/**
 * Brands and item choices for the form, designers for `assign`, point categories for
 * `set_points`. One short list, so every screen shares the same cached copy. A sheet that needs it
 * passes `enabled: false` until it opens.
 */
export function useRequestDesignOptions(enabled = true) {
  return useQuery({
    queryKey: requestDesignKeys.options(),
    queryFn: ({ signal }) => requestDesignApi.options(signal),
    enabled,
  });
}
