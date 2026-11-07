import { render, screen, userEvent } from '@testing-library/react-native';

import { Toggle } from './toggle';

describe('Toggle', () => {
  it('flips when uncontrolled', async () => {
    const onValueChange = jest.fn();
    await render(<Toggle label="Notifications" onValueChange={onValueChange} />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).not.toBeChecked();

    await userEvent.press(toggle);

    expect(toggle).toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('follows the passed value when controlled', async () => {
    await render(<Toggle label="Notifications" value />);

    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    await userEvent.press(toggle);

    expect(toggle).toBeChecked();
  });

  it('ignores presses when disabled', async () => {
    const onValueChange = jest.fn();
    await render(<Toggle disabled label="Notifications" onValueChange={onValueChange} />);

    await userEvent.press(screen.getByRole('switch', { name: 'Notifications' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
