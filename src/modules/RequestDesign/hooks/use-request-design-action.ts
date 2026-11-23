import { requestDesignApi } from '../api/requestDesignApi';
import type { RequestDesignActionInput, ResultInput } from '../types';
import { useDetailWrite } from './use-detail-write';

/** `submit_file` has its own endpoint (it may carry a file); every other action shares one. */
export type DetailWriteInput = RequestDesignActionInput | (ResultInput & { action: 'submit_file' });

/** A write to one existing document: pick, approve, assign, cancel, hand in the result and the rest. */
export function useRequestDesignAction(uuid: string) {
  return useDetailWrite(uuid, 'action', (input: DetailWriteInput) =>
    input.action === 'submit_file'
      ? requestDesignApi.submitResult(uuid, input)
      : requestDesignApi.act(uuid, input),
  );
}

export type RequestDesignActionMutation = ReturnType<typeof useRequestDesignAction>;
