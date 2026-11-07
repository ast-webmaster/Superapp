import { render, renderHook, screen, userEvent } from '@testing-library/react-native';

import { BottomNav, useBottomNavInset, type BottomNavItem } from './bottom-nav';

const home: BottomNavItem = { key: 'home', label: 'Home', icon: 'home' };
const apps: BottomNavItem = { key: 'apps', label: 'Apps', icon: 'grid' };

describe('BottomNav', () => {
  it('works with two items and marks the active one', async () => {
    await render(<BottomNav items={[home, apps]} activeKey="home" onChange={jest.fn()} />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveProp('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).toBeSelected();
    expect(screen.getByRole('link', { name: 'Apps' })).not.toBeSelected();
  });

  it('shows an unread count and names it for screen readers', async () => {
    const inbox: BottomNavItem = { key: 'inbox', label: 'Inbox', icon: 'bell', badge: 120 };
    await render(<BottomNav items={[home, inbox]} activeKey="home" onChange={jest.fn()} />);

    expect(screen.getByText('99+')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Inbox, 120 unread' })).toBeOnTheScreen();
    expect(screen.queryByTestId('home-badge')).toBeNull();
  });

  it('reports the pressed item', async () => {
    const onChange = jest.fn();
    await render(<BottomNav items={[home, apps]} activeKey="home" onChange={onChange} />);

    await userEvent.press(screen.getByRole('link', { name: 'Apps' }));

    expect(onChange).toHaveBeenCalledWith('apps');
  });
});

describe('useBottomNavInset', () => {
  it('clears the tab bar, the content gap, and the safe area', async () => {
    const { result } = await renderHook(() => useBottomNavInset());

    // The safe-area test mock reports a bottom inset of 0.
    expect(result.current).toBe(72 + 32);
  });
});
