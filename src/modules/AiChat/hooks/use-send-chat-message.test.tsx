import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAuthStore } from '@/core/auth';
import { AppError } from '@/core/errors';
import { ToastProvider } from '@/shared/ui';

import { aiChatApi } from '../api/aiChatApi';
import { aiChatKeys } from '../api/aiChatKeys';
import { useAiChatStore } from '../store/aiChatStore';
import type { ChatHistory, ChatMessage } from '../types';
import { useChatMessages } from './use-chat-messages';
import { useSendChatMessage } from './use-send-chat-message';

jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));
jest.mock('@/core/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
jest.mock('../api/aiChatApi', () => ({
  aiChatApi: { createSession: jest.fn(), send: jest.fn(), messages: jest.fn() },
}));

const api = aiChatApi as jest.Mocked<typeof aiChatApi>;

const message = (uuid: string, role: 'user' | 'assistant' = 'user'): ChatMessage => ({
  uuid,
  role,
  message: uuid,
  meta: null,
  created_at: '2026-11-14T07:00:00Z',
  attachments: [],
});
const history = (...messages: ChatMessage[]): ChatHistory => ({
  session: { uuid: 's-1', title: 'Chat' },
  messages,
});

async function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  const { result } = await renderHook(() => useSendChatMessage(), { wrapper });
  return { queryClient, result, invalidate };
}

beforeEach(() => {
  api.createSession.mockReset();
  api.send.mockReset();
  api.messages.mockReset();
  useAuthStore.setState({ status: 'authenticated', user: { id: 1 } as never });
  useAiChatStore.setState({ activeSessionUuid: null, pending: null, failedDraft: null });
  api.messages.mockResolvedValue(history());
});

it('creates a session first for a new chat', async () => {
  api.createSession.mockResolvedValueOnce({ uuid: 'new-1', title: 'Chat baru' });
  api.send.mockResolvedValueOnce({} as never);
  const { result } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(api.createSession).toHaveBeenCalledTimes(1);
  expect(api.send).toHaveBeenCalledWith(
    expect.objectContaining({ sessionUuid: 'new-1', message: 'Hi', files: [] }),
  );
  expect(useAiChatStore.getState().activeSessionUuid).toBe('new-1');
});

it('reuses the active session', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.send.mockResolvedValueOnce({} as never);
  const { result } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(api.createSession).not.toHaveBeenCalled();
  expect(api.send).toHaveBeenCalledWith(expect.objectContaining({ sessionUuid: 's-1' }));
});

it('sends the same trace id it shows progress for', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  let pendingTrace: string | undefined;
  api.send.mockImplementationOnce(async (input) => {
    pendingTrace = useAiChatStore.getState().pending?.traceId;
    expect(useAiChatStore.getState().pending?.sessionUuid).toBe('s-1');
    return input.traceId as never;
  });
  const { result } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(api.send.mock.calls[0]?.[0].traceId).toBe(pendingTrace);
});

it('success refreshes messages and sessions and clears pending', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.send.mockResolvedValueOnce({} as never);
  const { result, invalidate } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(invalidate).toHaveBeenCalledWith({ queryKey: aiChatKeys.messages('s-1') });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: aiChatKeys.sessions() });
  expect(useAiChatStore.getState().pending).toBeNull();
  expect(useAiChatStore.getState().failedDraft).toBeNull();
});

it('validation keeps the draft and refetches nothing', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.send.mockRejectedValueOnce(new AppError('File tidak bisa dibaca.', 'validation', 422));
  const { result, invalidate } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(useAiChatStore.getState().failedDraft).toEqual(
    expect.objectContaining({ message: 'Hi', files: [] }),
  );
  expect(useAiChatStore.getState().pending).toBeNull();
  expect(invalidate).not.toHaveBeenCalled();
});

it('unknown outcome refetches and keeps the draft', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.send.mockRejectedValueOnce(new AppError('slow', 'timeout'));
  const { result, invalidate } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(invalidate).toHaveBeenCalledWith({ queryKey: aiChatKeys.messages('s-1') });
  expect(useAiChatStore.getState().failedDraft).toEqual({ message: 'Hi', files: [] });
  expect(api.send).toHaveBeenCalledTimes(1);
});

it('unknown outcome that the server saved shows no error', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.messages.mockResolvedValueOnce(history(message('m-1')));
  api.send.mockRejectedValueOnce(new AppError('lost', 'network'));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  // As on the screen: the open chat's history is on display while the message is sent.
  const { result } = await renderHook(
    () => ({ chat: useSendChatMessage(), history: useChatMessages('s-1') }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.history.data?.messages).toHaveLength(1));
  // The refetch finds the question and its answer: the send went through.
  api.messages.mockResolvedValue(
    history(message('m-1'), message('m-2'), message('m-3', 'assistant')),
  );

  await act(() => result.current.chat.send('Hi', []));

  expect(useAiChatStore.getState().failedDraft).toBeNull();
});

it('keeps the draft when the history had not loaded before the send', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  // The chat failed to load, so nothing is known about it when the message goes.
  api.messages.mockRejectedValueOnce(new AppError('lost', 'network'));
  api.send.mockRejectedValueOnce(new AppError('slow', 'timeout'));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  const { result } = await renderHook(
    () => ({ chat: useSendChatMessage(), history: useChatMessages('s-1') }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.history.isError).toBe(true));
  // The refetch finds only older messages: the new one is not among them.
  api.messages.mockResolvedValue(history(message('old-1'), message('old-2', 'assistant')));

  await act(() => result.current.chat.send('Hi', []));

  expect(useAiChatStore.getState().failedDraft).toEqual(
    expect.objectContaining({ message: 'Hi', files: [] }),
  );
});

it('validation shows the server reason on the draft instead of a connection error', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.send.mockRejectedValueOnce(new AppError('File tidak bisa dibaca.', 'validation', 422));
  const { result } = await setup();

  await act(() => result.current.send('Hi', []));

  expect(useAiChatStore.getState().failedDraft?.error).toBe('File tidak bisa dibaca.');
});

it('writes nothing for the next user when the session ends during the send', async () => {
  useAuthStore.setState({ status: 'authenticated', user: { id: 1 } as never });
  api.createSession.mockResolvedValueOnce({ uuid: 'new-1', title: 'Chat baru' });
  api.send.mockImplementationOnce(async () => {
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    throw new AppError('expired', 'unauthorized', 401);
  });
  const { result } = await setup();

  await act(() => result.current.send('Rahasia', []));

  const state = useAiChatStore.getState();
  expect(state.failedDraft).toBeNull();
  expect(state.pending).toBeNull();
  expect(state.activeSessionUuid).toBeNull();
});
