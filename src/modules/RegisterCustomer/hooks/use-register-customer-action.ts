import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { registerCustomerApi } from '../api/registerCustomerApi';
import { registerCustomerKeys } from '../api/registerCustomerKeys';
import type { RegisterCustomerActionInput } from '../types';

/**
 * Confirm, approve, reject or send back one registration. Nothing changes on screen until the
 * server answers: the detail then shows the server's copy, never a status guessed locally.
 * Never retried (see query-client); the server also refuses a repeat with 409.
 */
export function useRegisterCustomerAction(uuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...registerCustomerKeys.detail(uuid), 'action'],
    mutationFn: (input: RegisterCustomerActionInput) => registerCustomerApi.act(uuid, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(registerCustomerKeys.detail(uuid), detail);
      // The registration moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: registerCustomerKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing (a missing remark, a customer code already in use). Anything else
      // (409, timeout, lost connection) may mean the document changed or the action went
      // through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: registerCustomerKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: registerCustomerKeys.lists() });
    },
  });
}
