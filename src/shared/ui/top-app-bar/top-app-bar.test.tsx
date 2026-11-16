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

  it('runs each action on the right', async () => {
    const onFilter = jest.fn();
    const onSearch = jest.fn();
    await render(
      <TopAppBar
        title="Requests"
        actions={[
          { icon: 'sliders', label: 'Filter', onPress: onFilter },
          { icon: 'search', label: 'Search', onPress: onSearch },
        ]}
      />,
    );

    await userEvent.press(screen.getByRole('button', { name: 'Filter' }));
    await userEvent.press(screen.getByRole('button', { name: 'Search' }));

    expect(onFilter).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('draws every action at the header size: a 40 circle in a 48 press area', async () => {
    await render(
      <TopAppBar
        title="AI chat"
        actions={[{ icon: 'history', label: 'History', onPress: jest.fn() }]}
      />,
    );

    const button = screen.getByRole('button', { name: 'History' });
    // Classes, not styles: NativeWind does not turn them into styles under jest.
    const circle = button.children[0] as { props: { className?: string } };
    expect(button.props.className).toContain('size-touch');
    expect(circle.props.className).toContain('size-10');
  });

  it('shows an action as on or unavailable', async () => {
    const onPress = jest.fn();
    await render(
      <TopAppBar
        title="Requests"
        actions={[
          { icon: 'search', label: 'Search', onPress, active: true },
          { icon: 'pencil', label: 'New', onPress, disabled: true },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Search' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'New' })).toBeDisabled();
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
