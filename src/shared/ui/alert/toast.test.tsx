import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable } from 'react-native';

import { ToastProvider, useToast } from './toast';

const messages = ['First', 'Second', 'Third'];

function ShowButtons() {
  const { show } = useToast();

  return messages.map((message) => (
    <Pressable
      key={message}
      role="button"
      aria-label={`Show ${message}`}
      onPress={() => show({ tone: 'info', message })}
    />
  ));
}

async function setup() {
  await render(
    <ToastProvider>
      <ShowButtons />
    </ToastProvider>,
  );
}

function show(message: string) {
  return fireEvent.press(screen.getByRole('button', { name: `Show ${message}` }));
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('ToastProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stacks at most two, dropping the oldest', async () => {
    await setup();

    await show('First');
    await show('Second');
    await show('Third');

    expect(screen.queryByText('First')).not.toBeOnTheScreen();
    expect(screen.getByText('Second')).toBeOnTheScreen();
    expect(screen.getByText('Third')).toBeOnTheScreen();
  });

  it('dismisses itself after five seconds', async () => {
    await setup();
    await show('First');

    await advance(4999);
    expect(screen.getByText('First')).toBeOnTheScreen();

    await advance(1);
    expect(screen.queryByText('First')).not.toBeOnTheScreen();
  });

  it('pauses while focus is inside and keeps the remaining time', async () => {
    await setup();
    await show('First');
    await advance(3000);

    await fireEvent(screen.getByText('First'), 'focus');
    await advance(10000);
    expect(screen.getByText('First')).toBeOnTheScreen();

    await fireEvent(screen.getByText('First'), 'blur');
    await advance(1999);
    expect(screen.getByText('First')).toBeOnTheScreen();

    await advance(1);
    expect(screen.queryByText('First')).not.toBeOnTheScreen();
  });

  it('can be dismissed by hand', async () => {
    await setup();
    await show('First');

    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('First')).not.toBeOnTheScreen();
  });
});

describe('useToast', () => {
  it('fails clearly outside the provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<ShowButtons />)).rejects.toThrow(
      'useToast must be used inside ToastProvider',
    );

    consoleError.mockRestore();
  });
});
