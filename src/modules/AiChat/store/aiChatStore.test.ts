import { useAuthStore } from '@/core/auth';

import { useAiChatStore } from './aiChatStore';

jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));
jest.mock('@/core/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));

it('forgets the chat when the user signs out', () => {
  useAuthStore.setState({ status: 'authenticated' });
  useAiChatStore.setState({
    activeSessionUuid: 's-1',
    pending: { sessionUuid: 's-1', message: 'Hi', files: [], traceId: 't-1' },
    failedDraft: { message: 'Hi', files: [] },
  });

  useAuthStore.setState({ status: 'unauthenticated' });

  const state = useAiChatStore.getState();
  expect(state.activeSessionUuid).toBeNull();
  expect(state.pending).toBeNull();
  expect(state.failedDraft).toBeNull();
});

it('keeps a message that did not send when the user opens another chat', () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1', failedDraft: { message: 'Hi', files: [] } });

  useAiChatStore.getState().setActiveSession('s-2');

  expect(useAiChatStore.getState().failedDraft).toEqual({ message: 'Hi', files: [] });
});
