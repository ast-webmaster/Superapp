import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { requireOptionalNativeModule } from 'expo';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { Text } from 'react-native';

import { ToastProvider } from '@/shared/ui';

import { MicButton } from './mic-button';
import { useVoiceInput } from './use-voice-input';

jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  requireOptionalNativeModule: jest.fn(),
}));
jest.mock('@/shared/hooks/use-is-online', () => ({ useIsOnline: () => true }));
jest.mock('expo-speech-recognition', () => {
  const listeners: Record<string, ((event: unknown) => void)[]> = {};
  return {
    ExpoSpeechRecognitionModule: {
      listeners,
      requestPermissionsAsync: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      addListener: jest.fn((name: string, listener: (event: unknown) => void) => {
        (listeners[name] ??= []).push(listener);
        return {
          remove: () => {
            listeners[name] = (listeners[name] ?? []).filter((item) => item !== listener);
          },
        };
      }),
    },
  };
});

const speech = ExpoSpeechRecognitionModule as unknown as {
  listeners: Record<string, ((event: unknown) => void)[]>;
  requestPermissionsAsync: jest.Mock;
  start: jest.Mock;
};
const nativeModule = requireOptionalNativeModule as jest.Mock;
const abort = (ExpoSpeechRecognitionModule as unknown as { abort: jest.Mock }).abort;
const emit = (name: string, event: unknown) =>
  act(() => (speech.listeners[name] ?? []).forEach((listener) => listener(event)));

function Harness({ value, onText }: { value: string; onText: (text: string) => void }) {
  const voice = useVoiceInput(value, onText);
  return <MicButton voice={voice} />;
}

async function renderMic(value = '') {
  const onText = jest.fn();
  await render(
    <ToastProvider>
      <Harness value={value} onText={onText} />
    </ToastProvider>,
  );
  return onText;
}

beforeEach(() => {
  nativeModule.mockReset().mockReturnValue({});
  speech.requestPermissionsAsync.mockReset().mockResolvedValue({ granted: true });
  speech.start.mockReset();
  for (const name of Object.keys(speech.listeners)) speech.listeners[name] = [];
});

it('hides the mic on a build without the speech module', async () => {
  nativeModule.mockReturnValue(null);
  await renderMic();

  expect(screen.queryByRole('button', { name: 'Start voice input' })).toBeNull();
});

it('says how to allow the microphone when permission is denied', async () => {
  speech.requestPermissionsAsync.mockResolvedValue({ granted: false });
  await renderMic();

  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));

  await waitFor(() =>
    expect(
      screen.getByText('Allow microphone access in Settings to use voice input.'),
    ).toBeTruthy(),
  );
  expect(speech.start).not.toHaveBeenCalled();
});

it('listens in Indonesian and adds what it hears after the typed text', async () => {
  const onText = await renderMic('Cek');

  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  await waitFor(() =>
    expect(speech.start).toHaveBeenCalledWith(
      expect.objectContaining({ lang: 'id-ID', interimResults: true }),
    ),
  );
  await emit('result', { isFinal: false, results: [{ transcript: 'halo' }] });

  expect(onText).toHaveBeenCalledWith('Cek halo');
  expect(screen.getByRole('button', { name: 'Stop listening' })).toBeTruthy();
});

it('tells the user when listening stops on an error', async () => {
  await renderMic();
  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  await waitFor(() => expect(speech.start).toHaveBeenCalled());

  await emit('error', { error: 'network', message: 'offline' });

  expect(screen.getByText('Voice input stopped. Try again.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeTruthy();
});

it('stays quiet when the user simply said nothing', async () => {
  await renderMic();
  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  await waitFor(() => expect(speech.start).toHaveBeenCalled());

  await emit('error', { error: 'no-speech', message: '' });

  expect(screen.queryByText('Voice input stopped. Try again.')).toBeNull();
});

function CancelHarness({ onText }: { onText: (text: string) => void }) {
  const voice = useVoiceInput('', onText);
  return (
    <>
      <MicButton voice={voice} />
      <Text onPress={voice.cancel}>cancel</Text>
    </>
  );
}

it('ignores what it hears after the message was sent', async () => {
  const onText = jest.fn();
  await render(
    <ToastProvider>
      <CancelHarness onText={onText} />
    </ToastProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  await waitFor(() => expect(speech.start).toHaveBeenCalled());

  await fireEvent.press(screen.getByText('cancel'));
  await emit('result', { isFinal: true, results: [{ transcript: 'halo' }] });

  expect(onText).not.toHaveBeenCalled();
  expect(abort).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeOnTheScreen();
});

it('recovers when the recognizer refuses to start', async () => {
  speech.start.mockImplementationOnce(() => {
    throw new Error('InvalidStateError');
  });
  await renderMic();

  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));

  await waitFor(() =>
    expect(screen.getByText('Voice input stopped. Try again.')).toBeOnTheScreen(),
  );
  expect(screen.getByRole('button', { name: 'Start voice input' })).toBeOnTheScreen();
  expect(speech.listeners.result ?? []).toHaveLength(0);
});

it('points to Settings when the browser blocks the mic', async () => {
  await renderMic();
  await fireEvent.press(screen.getByRole('button', { name: 'Start voice input' }));
  await waitFor(() => expect(speech.start).toHaveBeenCalled());

  await emit('error', { error: 'not-allowed', message: '' });

  expect(
    screen.getByText('Allow microphone access in Settings to use voice input.'),
  ).toBeOnTheScreen();
});
