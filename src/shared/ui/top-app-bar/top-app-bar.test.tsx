import { render, screen, userEvent } from '@testing-library/react-native';

import { renderTopAppBar, TopAppBar } from './top-app-bar';

describe('TopAppBar', () => {
  it('shows the title as a heading and no buttons by default', async () => {
    await render(<TopAppBar title="Inbox" />);

    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('goes back from the round button', async () => {
    const onBack = jest.fn();
    await render(<TopAppBar title="Request" onBack={onBack} />);

    await userEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('runs the action on the right', async () => {
    const onPress = jest.fn();
    await render(
      <TopAppBar title="Requests" action={{ icon: 'sliders', label: 'Filter', onPress }} />,
    );

    await userEvent.press(screen.getByRole('button', { name: 'Filter' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('renderTopAppBar', () => {
  it('has no back button when the stack has no screen to go back to', async () => {
    await render(
      renderTopAppBar({
        options: { title: 'Profile' },
        back: undefined,
        navigation: { goBack: jest.fn() },
      }),
    );

    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('goes back through the stack navigation when it can', async () => {
    const goBack = jest.fn();
    await render(
      renderTopAppBar({ options: { title: 'Profile' }, back: {}, navigation: { goBack } }),
    );

    await userEvent.press(screen.getByRole('button', { name: 'Back' }));

    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
