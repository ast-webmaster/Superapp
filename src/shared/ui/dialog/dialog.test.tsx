import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ConfirmProvider, useConfirm, type ConfirmOptions } from './dialog';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Asker(options: Omit<ConfirmOptions, 'title' | 'confirmLabel'>) {
  const confirm = useConfirm();
  return (
    <Text onPress={() => confirm({ title: 'Approve this?', confirmLabel: 'Approve', ...options })}>
      ask
    </Text>
  );
}

async function ask(options: Omit<ConfirmOptions, 'title' | 'confirmLabel'>) {
  await render(
    <ConfirmProvider>
      <Asker {...options} />
    </ConfirmProvider>,
  );
  await userEvent.press(screen.getByText('ask'));
}

const pressConfirm = () => userEvent.press(screen.getByRole('button', { name: 'Approve' }));

describe('ConfirmProvider', () => {
  it('shows the question with its two buttons', async () => {
    await ask({ onConfirm: jest.fn() });

    expect(screen.getByText('Approve this?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeOnTheScreen();
  });

  it('runs a plain onConfirm and never shows a loading state', async () => {
    const onConfirm = jest.fn();
    await ask({ onConfirm });

    await pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith('');
    expect(screen.queryByText('Working on it')).not.toBeOnTheScreen();
  });

  it('goes from loading to success while the request runs, then offers Done', async () => {
    const request = deferred();
    await ask({ onConfirm: () => request.promise, success: { title: 'Request approved' } });

    await pressConfirm();
    expect(screen.getByText('Working on it')).toBeOnTheScreen();
    expect(screen.queryByText('Approve this?')).not.toBeOnTheScreen();

    await act(async () => request.resolve());

    expect(screen.getByText('Request approved')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Done' })).toBeOnTheScreen();
  });

  it('closes by itself a moment after the success', async () => {
    jest.useFakeTimers();
    try {
      const request = deferred();
      await ask({ onConfirm: () => request.promise });
      // The sheet opens once it knows its own height, which Jest never measures.
      await act(async () => {
        fireEvent(screen.getByLabelText('Approve this?').parent!, 'layout', {
          nativeEvent: { layout: { height: 320 } },
        });
      });
      await act(async () => void jest.advanceTimersByTime(400));
      await pressConfirm();
      await act(async () => request.resolve());
      expect(screen.getByRole('button', { name: 'Done' })).toBeOnTheScreen();

      await act(async () => void jest.advanceTimersByTime(1700));
      await act(async () => void jest.advanceTimersByTime(100));
      await act(async () => void jest.advanceTimersByTime(500));

      expect(screen.queryByRole('button', { name: 'Done' })).not.toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the error and runs the request again on Try again', async () => {
    const first = deferred();
    const second = deferred();
    const onConfirm = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    await ask({ onConfirm });

    await pressConfirm();
    await act(async () => first.reject(new Error('The request changed.')));

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.getByText('The request changed.')).toBeOnTheScreen();

    await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Working on it')).toBeOnTheScreen();

    await act(async () => second.resolve());
    expect(screen.getByRole('button', { name: 'Done' })).toBeOnTheScreen();
  });

  it('keeps a required reason from starting the request', async () => {
    const onConfirm = jest.fn();
    await ask({
      onConfirm,
      reason: { label: 'Reason', required: true, requiredMessage: 'Enter a reason.' },
    });

    await pressConfirm();

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a reason.')).toBeOnTheScreen();
  });
});
