import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { productBorrowingApi } from '../api/productBorrowingApi';
import { productBorrowingKeys } from '../api/productBorrowingKeys';
import type { ExtendInput, ProductBorrowingActionInput, ProductBorrowingDetail } from '../types';

/**
 * A write on one existing document. Nothing changes on screen until the server answers: the
 * detail then shows the server's copy, never a status guessed locally. Never retried (see
 * query-client); the server also refuses a repeat with 409.
 */
function useDocumentWrite<Input>(
  uuid: string,
  name: string,
  write: (input: Input) => Promise<ProductBorrowingDetail>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...productBorrowingKeys.detail(uuid), name],
    mutationFn: write,
    onSuccess: (detail) => {
      queryClient.setQueryData(productBorrowingKeys.detail(uuid), detail);
      // The document moves between status filters. Not awaited: the detail is already current.
      void queryClient.invalidateQueries({ queryKey: productBorrowingKeys.lists() });
    },
    onError: (error) => {
      // A 422 changed nothing. Anything else (409, timeout, lost connection) may mean the
      // document changed or the write went through: read the server's version again.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: productBorrowingKeys.detail(uuid) });
      void queryClient.invalidateQueries({ queryKey: productBorrowingKeys.lists() });
    },
  });
}

/** Approve, reject, send back, process, receive, decide an extension, or cancel. */
export function useProductBorrowingAction(uuid: string) {
  return useDocumentWrite<ProductBorrowingActionInput>(uuid, 'action', (input) =>
    productBorrowingApi.act(uuid, input),
  );
}

/** The requester asks to keep the borrowed items longer. */
export function useExtendProductBorrowing(uuid: string) {
  return useDocumentWrite<ExtendInput>(uuid, 'extend', (input) =>
    productBorrowingApi.extend(uuid, input),
  );
}
