import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { marketingActivityApi } from '../api/marketingActivityApi';
import { marketingActivityKeys } from '../api/marketingActivityKeys';
import type { MarketingActivityDetail } from '../types';
import { useMarketingActivityAction } from './use-marketing-activity-action';

jest.mock('../api/marketingActivityApi', () => ({ marketingActivityApi: { act: jest.fn() } }));

const actMock = marketingActivityApi.act as jest.Mock;
const UUID = 'ma-1';
const detailKey = marketingActivityKeys.detail('combination', UUID);
const input = { action: 'approve' as const, updatedAt: '2026-11-08T10:00:00+07:00' };

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(detailKey, { status: 'AWAITING' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useMarketingActivityAction('combination', UUID), {
    wrapper,
  });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => actMock.mockReset());

it('acts in the group of the document it was opened for', async () => {
  actMock.mockResolvedValueOnce({ activity_uuid: UUID, status: 'ONGOING', allowed_actions: [] });
  const { result } = await setup();

  await act(() => result.current.mutateAsync(input));

  expect(actMock).toHaveBeenCalledWith('combination', UUID, input);
});

it('shows the server copy after success and refreshes the lists, not the whole cache', async () => {
  const server = {
    activity_uuid: UUID,
    status: 'ONGOING',
    allowed_actions: [],
  } as unknown as MarketingActivityDetail;
  actMock.mockResolvedValueOnce(server);
  const { queryClient, result, invalidated } = await setup();

  await act(() => result.current.mutateAsync(input));

  expect(queryClient.getQueryData(detailKey)).toEqual(server);
  expect(invalidated()).toEqual([marketingActivityKeys.lists()]);
});

it('keeps the cached status and reloads detail and lists on a conflict', async () => {
  actMock.mockRejectedValueOnce(new AppError('changed', 'conflict', 409));
  const { queryClient, result, invalidated } = await setup();

  await act(async () => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));

  // Never a status guessed on the device: the cache still holds what the server last said.
  expect(queryClient.getQueryData(detailKey)).toEqual({ status: 'AWAITING' });
  expect(invalidated()).toEqual([detailKey, marketingActivityKeys.lists()]);
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
