import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';
import type { PurchaseRequestDetail } from '../types';
import { usePurchaseRequestAction } from './use-purchase-request-action';

jest.mock('../api/purchaseRequestApi', () => ({ purchaseRequestApi: { act: jest.fn() } }));

const actMock = purchaseRequestApi.act as jest.Mock;
const UUID = 'pr-1';
const input = { action: 'approve' as const, updatedAt: '2026-11-08T10:00:00+07:00' };

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(purchaseRequestKeys.detail(UUID), { status: 'AWAITING' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => usePurchaseRequestAction(UUID), { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => actMock.mockReset());

it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
  const server = {
    uuid: UUID,
    status: 'APPROVED',
    allowed_actions: [],
  } as unknown as PurchaseRequestDetail;
  actMock.mockResolvedValueOnce(server);
  const { queryClient, result, invalidated } = await setup();

  await act(() => result.current.mutateAsync(input));

  expect(queryClient.getQueryData(purchaseRequestKeys.detail(UUID))).toEqual(server);
  expect(invalidated()).toEqual([purchaseRequestKeys.lists()]);
});

it('keeps the cached status and reloads detail and lists on a conflict', async () => {
  actMock.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
  const { queryClient, result, invalidated } = await setup();

  await act(async () => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));

  // Never a status guessed on the device: the cache still holds what the server last said.
  expect(queryClient.getQueryData(purchaseRequestKeys.detail(UUID))).toEqual({
    status: 'AWAITING',
  });
  expect(invalidated()).toEqual([purchaseRequestKeys.detail(UUID), purchaseRequestKeys.lists()]);
  expect(actMock).toHaveBeenCalledTimes(1);
});

it('reloads nothing after a validation error, which changed nothing', async () => {
  actMock.mockRejectedValueOnce(
    new AppError('Validasi gagal', 'validation', 422, { remarks: ['required'] }),
  );
  const { result, invalidated } = await setup();

  await act(async () => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(invalidated()).toEqual([]);
});
