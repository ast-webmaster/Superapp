import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { CopyButton } from './copy-button';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

describe('CopyButton', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('copies the text, confirms it, then goes back', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<CopyButton text="PA-2611-0001" label="Copy request number" />);

    await user.press(screen.getByRole('button', { name: 'Copy request number' }));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('PA-2611-0001');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Copy request number' })).toBeOnTheScreen();
  });
});
