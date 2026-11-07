import { render, screen, userEvent } from '@testing-library/react-native';

import { Button } from './button';

describe('Button', () => {
  it('fires onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Open workspace</Button>);

    await userEvent.press(screen.getByRole('button', { name: 'Open workspace' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button disabled onPress={onPress}>
        Open workspace
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Open workspace' });
    await userEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while loading and reports that it is busy', async () => {
    const onPress = jest.fn();
    await render(
      <Button loading onPress={onPress}>
        Open workspace
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Open workspace' });
    await userEvent.press(button);

    expect(button).toBeBusy();
    expect(onPress).not.toHaveBeenCalled();
  });
});
