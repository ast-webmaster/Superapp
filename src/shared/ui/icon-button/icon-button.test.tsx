import { render, screen, userEvent } from '@testing-library/react-native';

import { IconButton } from './icon-button';

describe('IconButton', () => {
  it('is named by its label and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="heart" label="Save to favorites" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: 'Save to favorites' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes the active state', async () => {
    await render(<IconButton active icon="bookmark" label="Bookmark" />);

    expect(screen.getByRole('button', { name: 'Bookmark' })).toBeSelected();
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<IconButton disabled icon="share" label="Share" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: 'Share' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
