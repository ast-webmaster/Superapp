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
