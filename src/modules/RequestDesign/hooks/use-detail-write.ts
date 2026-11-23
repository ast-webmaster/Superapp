import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { requestDesignKeys } from '../api/requestDesignKeys';
import type { RequestDesignDetail } from '../types';

/**
 * A write to one existing document that answers with the document. Nothing changes on screen until
 * the server answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function useDetailWrite<Input>(
  uuid: string,
  name: string,
  write: (input: Input) => Promise<RequestDesignDetail>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...requestDesignKeys.detail(uuid), name],
    mutationFn: write,
    onSuccess: (detail) => {
      queryClient.setQueryData(requestDesignKeys.detail(uuid), detail);
      // The document moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.lists() });
      // Approving completes it and set_points changes what the designer earned.
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.analyticsAll() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // document changed or the write went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.lists() });
    },
  });
}
