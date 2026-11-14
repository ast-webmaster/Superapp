import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { priceApprovalApi } from '../api/priceApprovalApi';
import { priceApprovalKeys } from '../api/priceApprovalKeys';
import { emptyDraft } from '../create/draft';
import type { PriceApprovalDetail } from '../types';
import { useCreatePriceApproval } from './use-create-price-approval';

jest.mock('../api/priceApprovalApi', () => ({ priceApprovalApi: { create: jest.fn() } }));

const createMock = priceApprovalApi.create as jest.Mock;

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useCreatePriceApproval(), { wrapper });
  return { queryClient, result, invalidate };
}

beforeEach(() => createMock.mockReset());

it('stores the server copy as the detail and refreshes the lists', async () => {
  const server = { pa_uuid: 'pa-9', pa_no: 'PA-2611-X-1' } as unknown as PriceApprovalDetail;
  createMock.mockResolvedValueOnce(server);
  const { queryClient, result, invalidate } = await setup();

  await act(() => result.current.mutateAsync(emptyDraft));

  expect(queryClient.getQueryData(priceApprovalKeys.detail('pa-9'))).toEqual(server);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: priceApprovalKeys.lists() });
});

it('refreshes nothing on a validation error: nothing was saved', async () => {
  createMock.mockRejectedValueOnce(new AppError('invalid', 'validation', 422));
  const { result, invalidate } = await setup();

  await act(() => result.current.mutateAsync(emptyDraft).catch(() => undefined));

  expect(invalidate).not.toHaveBeenCalled();
});

it('refreshes the lists when the outcome is unknown', async () => {
  createMock.mockRejectedValueOnce(new AppError('slow', 'timeout'));
  const { result, invalidate } = await setup();

  await act(() => result.current.mutateAsync(emptyDraft).catch(() => undefined));

  expect(invalidate).toHaveBeenCalledWith({ queryKey: priceApprovalKeys.lists() });
});
