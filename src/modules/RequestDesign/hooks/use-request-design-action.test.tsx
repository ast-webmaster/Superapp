import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { requestDesignApi } from '../api/requestDesignApi';
import { requestDesignKeys } from '../api/requestDesignKeys';
import type { RequestDesignDetail } from '../types';
import { useRequestDesignAction } from './use-request-design-action';
import { useSaveRequestDesign } from './use-save-request-design';

jest.mock('../api/requestDesignApi', () => ({
  requestDesignApi: {
    act: jest.fn(),
    submitResult: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const api = requestDesignApi as unknown as Record<
  'act' | 'submitResult' | 'create' | 'update',
  jest.Mock
>;
const UUID = 'doc-1';

async function setup<T>(useHook: () => T) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(requestDesignKeys.detail(UUID), { status: 'AWAITING PICK' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(useHook, { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()));

describe('useRequestDesignAction', () => {
  const pick = { action: 'pick' as const, updatedAt: '2026-11-20T09:15:00+07:00' };

  it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
    const server = { uuid: UUID, status: 'PICKED' } as unknown as RequestDesignDetail;
    api.act.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() => useRequestDesignAction(UUID));

    await act(() => result.current.mutateAsync(pick));

    expect(api.act).toHaveBeenCalledWith(UUID, pick);
    expect(queryClient.getQueryData(requestDesignKeys.detail(UUID))).toEqual(server);
    expect(invalidated()).toEqual([requestDesignKeys.lists(), requestDesignKeys.analyticsAll()]);
  });

  it('sends handing in the result to its own endpoint', async () => {
    api.submitResult.mockResolvedValueOnce({ uuid: UUID, status: 'AWAITING APPROVAL' });
    const { result } = await setup(() => useRequestDesignAction(UUID));
    const input = {
      action: 'submit_file' as const,
      updatedAt: pick.updatedAt,
      fileType: 'LINK' as const,
      fileLink: 'https://drive.example.com/hasil',
    };

    await act(() => result.current.mutateAsync(input));

    expect(api.submitResult).toHaveBeenCalledWith(UUID, input);
    expect(api.act).not.toHaveBeenCalled();
  });

  it('keeps the cached status and reloads detail and lists on a conflict', async () => {
    api.act.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
    const { queryClient, result, invalidated } = await setup(() => useRequestDesignAction(UUID));

    await act(async () => result.current.mutate(pick));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(requestDesignKeys.detail(UUID))).toEqual({
      status: 'AWAITING PICK',
    });
    expect(invalidated()).toEqual([requestDesignKeys.detail(UUID), requestDesignKeys.lists()]);
    expect(api.act).toHaveBeenCalledTimes(1);
  });

  it('reloads nothing after a validation error, which changed nothing', async () => {
    api.act.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useRequestDesignAction(UUID));

    await act(async () => result.current.mutate(pick));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });

  it('reads the document again after a lost connection, since the action may have gone through', async () => {
    api.act.mockRejectedValueOnce(new AppError('offline', 'network'));
    const { result, invalidated } = await setup(() => useRequestDesignAction(UUID));

    await act(async () => result.current.mutate(pick));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([requestDesignKeys.detail(UUID), requestDesignKeys.lists()]);
  });
});

describe('useSaveRequestDesign', () => {
  const draft = {} as never;

  it('creates a request, caches the server copy under its uuid and refreshes the lists', async () => {
    const created = { uuid: 'new-1', status: 'AWAITING PICK' } as unknown as RequestDesignDetail;
    api.create.mockResolvedValueOnce(created);
    const { queryClient, result, invalidated } = await setup(() => useSaveRequestDesign());

    await act(() => result.current.mutateAsync(draft));

    expect(api.create).toHaveBeenCalledWith(draft);
    expect(queryClient.getQueryData(requestDesignKeys.detail('new-1'))).toEqual(created);
    expect(invalidated()).toEqual([requestDesignKeys.lists()]);
  });

  it('edits with the version the form was filled from', async () => {
    api.update.mockResolvedValueOnce({ uuid: UUID, status: 'AWAITING PICK' });
    const { result } = await setup(() =>
      useSaveRequestDesign({ uuid: UUID, updatedAt: '2026-11-19T09:15:00+07:00' }),
    );

    await act(() => result.current.mutateAsync(draft));

    expect(api.update).toHaveBeenCalledWith(UUID, draft, '2026-11-19T09:15:00+07:00');
    expect(api.create).not.toHaveBeenCalled();
  });

  it('reloads nothing after a validation error, which saved nothing', async () => {
    api.create.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useSaveRequestDesign());

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });

  it('reads the lists and the document again after a conflict on an edit', async () => {
    api.update.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
    const { result, invalidated } = await setup(() =>
      useSaveRequestDesign({ uuid: UUID, updatedAt: 'x' }),
    );

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([requestDesignKeys.lists(), requestDesignKeys.detail(UUID)]);
  });
});
