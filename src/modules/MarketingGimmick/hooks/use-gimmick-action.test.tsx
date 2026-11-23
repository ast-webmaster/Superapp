import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { marketingGimmickApi } from '../api/marketingGimmickApi';
import { marketingGimmickKeys } from '../api/marketingGimmickKeys';
import type { GimmickDetail } from '../types';
import { useGimmickAction } from './use-gimmick-action';
import { useSubmitGimmick } from './use-submit-gimmick';

jest.mock('../api/marketingGimmickApi', () => ({
  marketingGimmickApi: { act: jest.fn(), create: jest.fn() },
}));

const api = marketingGimmickApi as unknown as Record<'act' | 'create', jest.Mock>;
const UUID = 'doc-1';

async function setup<T>(useHook: () => T) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(marketingGimmickKeys.detail('request', UUID), { status: 'AWAITING' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(useHook, { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()));

describe('useGimmickAction', () => {
  const input = { action: 'approve' as const, updatedAt: '2026-11-20T09:15:00+07:00' };

  it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
    const server = { uuid: UUID, status: 'AWAITING PROCESSED' } as unknown as GimmickDetail;
    api.act.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() =>
      useGimmickAction('request', UUID),
    );

    await act(() => result.current.mutateAsync(input));

    expect(api.act).toHaveBeenCalledWith('request', UUID, input);
    expect(queryClient.getQueryData(marketingGimmickKeys.detail('request', UUID))).toEqual(server);
    expect(invalidated()).toEqual([marketingGimmickKeys.lists('request')]);
  });

  it('keeps the cached status and reloads detail and lists on a conflict', async () => {
    api.act.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
    const { queryClient, result, invalidated } = await setup(() =>
      useGimmickAction('request', UUID),
    );

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(marketingGimmickKeys.detail('request', UUID))).toEqual({
      status: 'AWAITING',
    });
    expect(invalidated()).toEqual([
      marketingGimmickKeys.detail('request', UUID),
      marketingGimmickKeys.lists('request'),
    ]);
    expect(api.act).toHaveBeenCalledTimes(1);
  });

  it('reloads nothing after a validation error, which changed nothing', async () => {
    api.act.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useGimmickAction('request', UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });

  it('reads the document again after a lost connection, since the action may have gone through', async () => {
    api.act.mockRejectedValueOnce(new AppError('offline', 'network'));
    const { result, invalidated } = await setup(() => useGimmickAction('request', UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([
      marketingGimmickKeys.detail('request', UUID),
      marketingGimmickKeys.lists('request'),
    ]);
  });
});

describe('useSubmitGimmick', () => {
  const draft = {} as never;

  it('caches the server copy under the new uuid and refreshes the lists and the stock pickers', async () => {
    const created = { uuid: 'new-1', status: 'AWAITING' } as unknown as GimmickDetail;
    api.create.mockResolvedValueOnce(created);
    const { queryClient, result, invalidated } = await setup(() => useSubmitGimmick('request'));

    await act(() => result.current.mutateAsync(draft));

    expect(api.create).toHaveBeenCalledWith('request', draft);
    expect(queryClient.getQueryData(marketingGimmickKeys.detail('request', 'new-1'))).toEqual(
      created,
    );
    expect(invalidated()).toEqual([
      marketingGimmickKeys.lists('request'),
      marketingGimmickKeys.lookups('request'),
    ]);
  });

  it('reloads nothing after a validation error, which saved nothing', async () => {
    api.create.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useSubmitGimmick('inbound'));

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });

  it('reads the lists again after a lost connection, since it may have been saved', async () => {
    api.create.mockRejectedValueOnce(new AppError('offline', 'network'));
    const { result, invalidated } = await setup(() => useSubmitGimmick('inbound'));

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([marketingGimmickKeys.lists('inbound')]);
  });
});
