import { render, screen, userEvent } from '@testing-library/react-native';

import { ListGroup, ListRow } from './list-row';

describe('ListRow', () => {
  it('is a button when it can be pressed', async () => {
    const onPress = jest.fn();
    await render(<ListRow icon="user" label="Personal info" value="Budi" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: /Personal info/ }));

    expect(screen.getByText('Budi')).toBeOnTheScreen();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is plain content when it cannot', async () => {
    await render(<ListRow label="Version" value="1.0.0" />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});

describe('ListGroup', () => {
  it('puts a divider between rows and none after the last', async () => {
    await render(
      <ListGroup>
        <ListRow label="One" />
        <ListRow label="Two" />
        <ListRow label="Three" />
      </ListGroup>,
    );

    expect(screen.getAllByTestId('list-divider')).toHaveLength(2);
  });
});
