import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { purchaseRequestApi } from '../api/purchaseRequestApi';
import { purchaseRequestKeys } from '../api/purchaseRequestKeys';
import type { PurchaseRequestDetail } from '../types';
import { useReceivePurchaseRequest } from './use-receive-purchase-request';

jest.mock('../api/purchaseRequestApi', () => ({ purchaseRequestApi: { receive: jest.fn() } }));

const receiveMock = purchaseRequestApi.receive as jest.Mock;
const UUID = 'pr-1';

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(purchaseRequestKeys.detail(UUID), { status: 'COMPLETED' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useReceivePurchaseRequest(UUID), { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => receiveMock.mockReset());

it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
  const server = { uuid: UUID, status: 'RECEIVED' } as unknown as PurchaseRequestDetail;
  receiveMock.mockResolvedValueOnce(server);
  const { queryClient, result, invalidated } = await setup();

  await act(() => result.current.mutateAsync([1, 2]));

  expect(receiveMock).toHaveBeenCalledWith(UUID, [1, 2]);
  expect(queryClient.getQueryData(purchaseRequestKeys.detail(UUID))).toEqual(server);
  expect(invalidated()).toEqual([purchaseRequestKeys.lists()]);
});

it('keeps the cached status and reloads detail and lists on a conflict', async () => {
  receiveMock.mockRejectedValueOnce(new AppError('already received', 'conflict', 409));
  const { queryClient, result, invalidated } = await setup();

  await act(async () => result.current.mutate([1]));
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(queryClient.getQueryData(purchaseRequestKeys.detail(UUID))).toEqual({
    status: 'COMPLETED',
  });
  expect(invalidated()).toEqual([purchaseRequestKeys.detail(UUID), purchaseRequestKeys.lists()]);
  expect(receiveMock).toHaveBeenCalledTimes(1);
});

it('reloads nothing on a validation error', async () => {
  receiveMock.mockRejectedValueOnce(new AppError('invalid', 'validation', 422));
  const { result, invalidated } = await setup();

  await act(async () => result.current.mutate([1]));
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(invalidated()).toEqual([]);
});
