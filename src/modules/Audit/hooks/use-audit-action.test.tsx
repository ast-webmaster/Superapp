import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '@/core/errors';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';
import type { AuditDetail } from '../types';
import { useAuditAction } from './use-audit-action';

jest.mock('../api/auditApi', () => ({ auditApi: { act: jest.fn() } }));

const actMock = auditApi.act as jest.Mock;
const UUID = 'audit-1';
const input = { action: 'follow_up' as const, remarks: 'Done' };

async function setup() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  queryClient.setQueryData(auditKeys.detail(UUID), { status: 'AWAITING FOLLOW UP' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = await renderHook(() => useAuditAction(UUID), { wrapper });
  const invalidated = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, result, invalidated };
}

beforeEach(() => actMock.mockReset());

it('shows the server copy after success and refreshes the parts, the lists and the count', async () => {
  const server = {
    uuid: UUID,
    status: 'AWAITING APPROVAL',
    allowed_actions: [],
  } as unknown as AuditDetail;
  actMock.mockResolvedValueOnce(server);
  const { queryClient, result, invalidated } = await setup();

  await act(() => result.current.mutateAsync(input));

  expect(queryClient.getQueryData(auditKeys.detail(UUID))).toEqual(server);
  expect(invalidated()).toEqual([
    auditKeys.detail(UUID),
    auditKeys.lists(),
    auditKeys.actionCount(),
  ]);
});

it('keeps the cached status and changes nothing when the server refuses with a reason (422)', async () => {
  actMock.mockRejectedValueOnce(
    new AppError('There are still 2 audit finding(s) without a response.', 'validation', 422),
  );
  const { queryClient, result, invalidated } = await setup();

  await act(async () => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));

  // Never a status guessed on the device: the cache still holds what the server last said.
  expect(queryClient.getQueryData(auditKeys.detail(UUID))).toEqual({
    status: 'AWAITING FOLLOW UP',
  });
  expect(invalidated()).toEqual([]);
  expect(actMock).toHaveBeenCalledTimes(1);
});

it('reloads the card, the lists and the count when the outcome is unknown', async () => {
  actMock.mockRejectedValueOnce(new AppError('Cannot reach the server.', 'network'));
  const { result, invalidated } = await setup();

  await act(async () => result.current.mutate(input));
  await waitFor(() => expect(result.current.isError).toBe(true));

  expect(invalidated()).toEqual([
    auditKeys.detail(UUID),
    auditKeys.lists(),
    auditKeys.actionCount(),
  ]);
});
