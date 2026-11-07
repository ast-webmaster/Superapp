import { render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { Alert } from './alert';

describe('Alert', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the alert role for danger and announces it', async () => {
    const speak = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(<Alert tone="danger" message="Something went wrong. Please try again." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
    expect(speak).toHaveBeenCalledWith('Something went wrong. Please try again.');
  });

  it.each(['success', 'warning', 'info'] as const)('uses the status role for %s', async (tone) => {
    await render(<Alert tone={tone} message="Account created successfully" />);

    expect(screen.getByRole('status')).toBeOnTheScreen();
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it('offers a dismiss button only when it can be dismissed', async () => {
    const onDismiss = jest.fn();
    await render(<Alert tone="info" message="Saved" onDismiss={onDismiss} />);

    await userEvent.press(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has no dismiss button by default', async () => {
    await render(<Alert tone="info" message="Saved" />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});
