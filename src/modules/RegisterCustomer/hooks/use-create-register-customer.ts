import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { registerCustomerApi } from '../api/registerCustomerApi';
import { registerCustomerKeys } from '../api/registerCustomerKeys';
import type { RegisterCustomerDraft } from '../types';

/**
 * Sends a new registration. Nothing is shown as created until the server answers 201; the detail
 * then holds the server's copy (its number and status). Never retried (see query-client): a lost
 * connection leaves the outcome unknown, so the lists are read again either way.
 */
export function useCreateRegisterCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...registerCustomerKeys.all, 'create'],
    mutationFn: (draft: RegisterCustomerDraft) => registerCustomerApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(registerCustomerKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: registerCustomerKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a timeout or a lost connection the registration may have gone
      // through, so the list is refreshed and the user checks it before sending again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: registerCustomerKeys.lists() });
    },
  });
}
