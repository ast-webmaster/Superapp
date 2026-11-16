import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { requireOptionalNativeModule } from 'expo';
import { Keyboard, Platform, StyleSheet } from 'react-native';

import { ConfirmProvider, ToastProvider } from '@/shared/ui';

import { aiChatApi } from '../api/aiChatApi';
import { useAiChatStore } from '../store/aiChatStore';
import type { ChatHistory } from '../types';
import { AiChatScreen } from './ai-chat-screen';

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  requireOptionalNativeModule: jest.fn(),
}));
jest.mock('@/core/api', () => ({
  apiClient: {},
  setAccessToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  setForbiddenHandler: jest.fn(),
}));
jest.mock('@/core/storage', () => ({
  secureStorage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
}));
// Passes its props through, so a test can read which behavior the screen chose.
jest.mock('react-native/Libraries/Components/Keyboard/KeyboardAvoidingView', () => {
  const { View } = jest.requireActual('react-native');
  const Avoider = (props: object) => <View testID="keyboard-avoider" {...props} />;
  return { __esModule: true, default: Avoider };
});
jest.mock('@/shared/hooks/use-is-online', () => ({ useIsOnline: () => true }));
jest.mock('../api/aiChatApi', () => ({
  aiChatApi: { messages: jest.fn(), progress: jest.fn(), sessions: jest.fn() },
}));

const api = aiChatApi as jest.Mocked<typeof aiChatApi>;

const history: ChatHistory = {
  session: { uuid: 's-1', title: 'Stok' },
  messages: [
    {
      uuid: 'm-1',
      role: 'user',
      message: 'Berapa stok?',
      meta: null,
      created_at: '2026-11-14T07:00:00Z',
      attachments: [],
    },
    {
      uuid: 'm-2',
      role: 'assistant',
      message: 'Stok ada **12** unit.',
      meta: { type: null, suggestions: [], assumptions: [], exportable: false },
      created_at: '2026-11-14T07:00:30Z',
      attachments: [],
    },
  ],
};

async function renderScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <AiChatScreen />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
  api.messages.mockReset().mockResolvedValue(history);
  api.progress.mockReset().mockResolvedValue({ steps: [], done: false });
  useAiChatStore.setState({ activeSessionUuid: null, pending: null, failedDraft: null });
});

it('starts on a new, empty chat', async () => {
  await renderScreen();

  expect(screen.getByText('Ask me anything')).toBeOnTheScreen();
});

it('shows a past chat with its messages and the day', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  await renderScreen();

  expect(await screen.findByText('Berapa stok?')).toBeOnTheScreen();
  expect(screen.getByText('12')).toBeOnTheScreen();
  expect(screen.getAllByText(/ · \d\d:\d\d$/)).toHaveLength(1);
});

it('locks history and new chat while a message is on its way', async () => {
  useAiChatStore.setState({
    activeSessionUuid: 's-1',
    pending: { sessionUuid: 's-1', message: 'Lagi?', files: [], traceId: 't-1' },
  });
  await renderScreen();

  expect(screen.getByRole('button', { name: 'Chat history' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'New chat' })).toBeDisabled();
  expect(screen.getByText('Lagi?')).toBeOnTheScreen();
  expect(screen.getByText('Thinking')).toBeOnTheScreen();
});

it('puts a message that may not have arrived back in the field', async () => {
  useAiChatStore.setState({ failedDraft: { message: 'Coba lagi', files: [] } });
  await renderScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Edit and resend' }));

  expect(screen.getByLabelText('Message').props.value).toBe('Coba lagi');
  expect(useAiChatStore.getState().failedDraft).toBeNull();
});

it('waits for the chat to load before a message can be sent', async () => {
  useAiChatStore.setState({ activeSessionUuid: 's-1' });
  api.messages.mockReturnValue(new Promise(() => {}));
  await renderScreen();

  await fireEvent.changeText(screen.getByLabelText('Message'), 'Hi');

  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
});

describe('keyboard', () => {
  const os = Platform.OS;
  afterEach(() => {
    Platform.OS = os;
  });

  it('lifts the composer above the keyboard on Android, which no longer resizes the window', async () => {
    Platform.OS = 'android';
    await renderScreen();

    expect(screen.getByTestId('keyboard-avoider').props.behavior).toBe('padding');
  });

  it('drops the bottom-nav gap as the keyboard starts to open on iOS', async () => {
    const handlers: Record<string, (() => void)[]> = {};
    const listen = jest.spyOn(Keyboard, 'addListener').mockImplementation((event, handler) => {
      (handlers[event] ??= []).push(handler as () => void);
      return { remove: jest.fn() } as never;
    });
    await renderScreen();
    const dock = () => StyleSheet.flatten(screen.getByTestId('composer-dock').props.style);
    expect(dock().paddingBottom).toBeGreaterThan(8);

    await act(() => (handlers.keyboardWillShow ?? []).forEach((handler) => handler()));

    expect(dock().paddingBottom).toBe(8);
    listen.mockRestore();
  });
});
