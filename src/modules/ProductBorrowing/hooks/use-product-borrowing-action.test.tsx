import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { productBorrowingApi } from '../api/productBorrowingApi';
import { productBorrowingKeys } from '../api/productBorrowingKeys';
import type { ProductBorrowingDetail } from '../types';
import {
  useExtendProductBorrowing,
  useProductBorrowingAction,
} from './use-product-borrowing-action';
import { useSubmitProductBorrowing } from './use-submit-product-borrowing';

jest.mock('../api/productBorrowingApi', () => ({
  productBorrowingApi: {
    act: jest.fn(),
    extend: jest.fn(),
    create: jest.fn(),
    resubmit: jest.fn(),
  },
}));

const api = productBorrowingApi as unknown as Record<
  'act' | 'extend' | 'create' | 'resubmit',
  jest.Mock
>;
const UUID = 'pb-1';

async function setup<T>(useHook: () => T) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(productBorrowingKeys.detail(UUID), { status: 'AWAITING APPROVAL' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(useHook, { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()));

describe('useProductBorrowingAction', () => {
  const input = { action: 'approve' as const, updatedAt: '2026-11-19T09:15:00+07:00' };

  it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
    const server = { uuid: UUID, status: 'AWAITING PROCESS' } as unknown as ProductBorrowingDetail;
    api.act.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() => useProductBorrowingAction(UUID));

    await act(() => result.current.mutateAsync(input));

    expect(api.act).toHaveBeenCalledWith(UUID, input);
    expect(queryClient.getQueryData(productBorrowingKeys.detail(UUID))).toEqual(server);
    expect(invalidated()).toEqual([productBorrowingKeys.lists()]);
  });

  it('keeps the cached status and reloads detail and lists on a conflict', async () => {
    api.act.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
    const { queryClient, result, invalidated } = await setup(() => useProductBorrowingAction(UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(productBorrowingKeys.detail(UUID))).toEqual({
      status: 'AWAITING APPROVAL',
    });
    expect(invalidated()).toEqual([
      productBorrowingKeys.detail(UUID),
      productBorrowingKeys.lists(),
    ]);
    expect(api.act).toHaveBeenCalledTimes(1);
  });

  it('reloads nothing after a validation error, which changed nothing', async () => {
    api.act.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useProductBorrowingAction(UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });
});

describe('useExtendProductBorrowing', () => {
  const input = {
    endDate: '2026-12-03',
    reason: 'Still in use',
    updatedAt: '2026-11-26T09:15:00+07:00',
  };

  it('shows the server copy after success', async () => {
    const server = { uuid: UUID, status: 'REQUEST EXTEND' } as unknown as ProductBorrowingDetail;
    api.extend.mockResolvedValueOnce(server);
    const { queryClient, result, invalidated } = await setup(() => useExtendProductBorrowing(UUID));

    await act(() => result.current.mutateAsync(input));

    expect(api.extend).toHaveBeenCalledWith(UUID, input);
    expect(queryClient.getQueryData(productBorrowingKeys.detail(UUID))).toEqual(server);
    expect(invalidated()).toEqual([productBorrowingKeys.lists()]);
  });

  it('reads the document again after a lost connection, since it may have been saved', async () => {
    api.extend.mockRejectedValueOnce(new AppError('offline', 'network'));
    const { result, invalidated } = await setup(() => useExtendProductBorrowing(UUID));

    await act(async () => result.current.mutate(input));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([
      productBorrowingKeys.detail(UUID),
      productBorrowingKeys.lists(),
    ]);
  });
});

describe('useSubmitProductBorrowing', () => {
  const draft = {} as never;

  it('creates when it has nothing to resubmit and caches the server copy under the new uuid', async () => {
    const created = {
      uuid: 'new-1',
      status: 'AWAITING APPROVAL',
    } as unknown as ProductBorrowingDetail;
    api.create.mockResolvedValueOnce(created);
    const { queryClient, result, invalidated } = await setup(() => useSubmitProductBorrowing());

    await act(() => result.current.mutateAsync(draft));

    expect(api.resubmit).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(productBorrowingKeys.detail('new-1'))).toEqual(created);
    expect(invalidated()).toEqual([productBorrowingKeys.lists()]);
  });

  it('resubmits with the version the form was filled from, and reads it again on a conflict', async () => {
    api.resubmit.mockRejectedValueOnce(new AppError('cannot', 'conflict', 409));
    const resubmit = { uuid: UUID, updatedAt: '2026-11-19T09:15:00+07:00' };
    const { result, invalidated } = await setup(() => useSubmitProductBorrowing(resubmit));

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(api.resubmit).toHaveBeenCalledWith(UUID, draft, resubmit.updatedAt);
    expect(invalidated()).toEqual([
      productBorrowingKeys.lists(),
      productBorrowingKeys.detail(UUID),
    ]);
  });

  it('reloads nothing after a validation error, which saved nothing', async () => {
    api.create.mockRejectedValueOnce(new AppError('Validasi gagal', 'validation', 422));
    const { result, invalidated } = await setup(() => useSubmitProductBorrowing());

    await act(async () => result.current.mutate(draft));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidated()).toEqual([]);
  });
});
