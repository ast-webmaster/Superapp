import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toAppError } from '@/core/errors';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';
import type { RequestDesignDraft } from '../types';

/**
 * Sends a new document, or with `edit` the changed content of one still waiting to be picked
 * (`updatedAt` is the version the form was filled from). Nothing is shown as saved until the server
 * answers; the detail then holds the server's copy (its number, status and points). Never retried
 * (see query-client): a lost connection leaves the outcome unknown, so the server's version is
 * read again and the user checks it before sending a second time.
 */
export function useSaveRequestDesign(edit?: { uuid: string; updatedAt: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...requestDesignKeys.all, edit ? 'edit' : 'create', edit?.uuid],
    mutationFn: (draft: RequestDesignDraft) =>
      edit
        ? requestDesignApi.update(edit.uuid, draft, edit.updatedAt)
        : requestDesignApi.create(draft),
    onSuccess: (detail) => {
      queryClient.setQueryData(requestDesignKeys.detail(detail.uuid), detail);
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.lists() });
    },
    onError: (error) => {
      // A 422 saved nothing. After a conflict, a timeout or a lost connection the document may
      // have changed or been saved.
      if (toAppError(error).code === 'validation') return;
      void queryClient.invalidateQueries({ queryKey: requestDesignKeys.lists() });
      if (edit) {
        void queryClient.invalidateQueries({ queryKey: requestDesignKeys.detail(edit.uuid) });
      }
    },
  });
}
