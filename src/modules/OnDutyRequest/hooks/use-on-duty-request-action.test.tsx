import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { onDutyRequestApi } from '../api/onDutyRequestApi';
import { onDutyRequestKeys } from '../api/onDutyRequestKeys';
import type { OnDutyRequestDetail } from '../types';
import { useOnDutyRequestAction } from './use-on-duty-request-action';
import { useSubmitDeclaration } from './use-submit-declaration';
import { useSubmitOnDutyRequest } from './use-submit-on-duty-request';

jest.mock('../api/onDutyRequestApi', () => ({
  onDutyRequestApi: { act: jest.fn(), create: jest.fn(), resubmit: jest.fn(), declare: jest.fn() },
}));

const api = onDutyRequestApi as unknown as Record<
  'act' | 'create' | 'resubmit' | 'declare',
  jest.Mock
>;
const UUID = 'odr-1';

async function setup<T>(useHook: () => T) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(onDutyRequestKeys.detail(UUID), { status: 'AWAITING' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(useHook, { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()));

describe('useOnDutyRequestAction', () => {
  const input = { action: 'approve' as const, updatedAt: '2026-11-18T09:00:00+07:00' };

  it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
    const server = { uuid: UUID, status: 'APPROVED' } as unknown as OnDutyRequestDetail;
    api.act.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() => useOnDutyRequestAction(UUID));

    await act(() => result.current.mutateAsync(input));

    expect(queryClient.getQueryData(onDutyRequestKeys.detail(UUID))).toEqual(server);
    expect(invalidated()).toEqual([onDutyRequestKeys.lists()]);
  });

  it('keeps the cached status and reloads detail and lists on a conflict', async () => {
    api.act.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
    const { queryClient, result, invalidated } = await setup(() => useOnDutyRequestAction(UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(onDutyRequestKeys.detail(UUID))).toEqual({
      status: 'AWAITING',
    });
    expect(invalidated()).toEqual([onDutyRequestKeys.detail(UUID), onDutyRequestKeys.lists()]);
    expect(api.act).toHaveBeenCalledTimes(1);
  });

  it('reloads nothing after a validation error, which changed nothing', async () => {
    api.act.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useOnDutyRequestAction(UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });
});

describe('useSubmitOnDutyRequest', () => {
  const draft = {} as never;

  it('creates when it has no uuid and caches the server copy under the new uuid', async () => {
    const created = { uuid: 'new-1', status: 'AWAITING' } as unknown as OnDutyRequestDetail;
    api.create.mockResolvedValueOnce(created);
    const { queryClient, result, invalidated } = await setup(() => useSubmitOnDutyRequest());

    await act(() => result.current.mutateAsync(draft));

    expect(api.resubmit).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(onDutyRequestKeys.detail('new-1'))).toEqual(created);
    expect(invalidated()).toEqual([onDutyRequestKeys.lists()]);
  });

  it('resubmits the given document, and reads it again when it is no longer in REVISE', async () => {
    api.resubmit.mockRejectedValueOnce(new AppError('cannot', 'conflict', 409));
    const { result, invalidated } = await setup(() => useSubmitOnDutyRequest(UUID));

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(api.resubmit).toHaveBeenCalledWith(UUID, draft);
    expect(invalidated()).toEqual([onDutyRequestKeys.lists(), onDutyRequestKeys.detail(UUID)]);
  });

  it('reloads nothing after a validation error, which saved nothing', async () => {
    api.create.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useSubmitOnDutyRequest());

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });
});

describe('useSubmitDeclaration', () => {
  it('shows the server copy after success', async () => {
    const server = {
      uuid: UUID,
      status: 'AWAITING APPROVAL DECLARATION',
    } as unknown as OnDutyRequestDetail;
    api.declare.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() => useSubmitDeclaration(UUID));

    await act(() => result.current.mutateAsync({} as never));

    expect(queryClient.getQueryData(onDutyRequestKeys.detail(UUID))).toEqual(server);
    expect(invalidated()).toEqual([onDutyRequestKeys.lists()]);
  });

  it('reads the document again after a lost connection, since it may have been saved', async () => {
    api.declare.mockRejectedValueOnce(new AppError('offline', 'network'));
    const { result, invalidated } = await setup(() => useSubmitDeclaration(UUID));

    await act(async () => result.current.mutate({} as never));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([onDutyRequestKeys.detail(UUID), onDutyRequestKeys.lists()]);
  });
});
