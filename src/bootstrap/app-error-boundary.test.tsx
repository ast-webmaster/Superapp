import { render, screen, userEvent } from '@testing-library/react-native';

import { AppErrorBoundary } from './app-error-boundary';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

describe('AppErrorBoundary', () => {
  it('explains the failure without exposing the cause and offers a retry', async () => {
    const retry = jest.fn(() => Promise.resolve());
    await render(<AppErrorBoundary error={new Error('secret detail')} retry={retry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(screen.queryByText(/secret detail/)).not.toBeOnTheScreen();

    await userEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
