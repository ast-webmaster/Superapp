import { render, screen, userEvent } from '@testing-library/react-native';

import { ModuleCard } from './module-card';

const longTitle =
  'Stock opname review for every warehouse in the Greater Jakarta distribution network';

describe('ModuleCard', () => {
  it('renders the full card and reports both actions', async () => {
    const onOpen = jest.fn();
    const onToggleFavorite = jest.fn();
    await render(
      <ModuleCard
        title="Stock opname"
        department="Warehouse, Jakarta DC"
        badges={[
          { label: '12 pending', tone: 'warning' },
          { label: 'Approval', tone: 'info' },
        ]}
        meta="Updated 5m ago"
        favorite
        onOpen={onOpen}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    expect(screen.getByText('12 pending')).toBeOnTheScreen();
    expect(screen.getByText('Updated 5m ago')).toBeOnTheScreen();

    await userEvent.press(screen.getByRole('button', { name: 'Open Stock opname' }));
    await userEvent.press(
      screen.getByRole('button', { name: 'Remove Stock opname from favorites' }),
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('clamps a very long title and copes with no badges or other optional props', async () => {
    await render(<ModuleCard title={longTitle} />);

    expect(screen.getByText(longTitle)).toHaveProp('numberOfLines', 2);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('shows a skeleton while loading', async () => {
    await render(<ModuleCard loading />);

    expect(screen.getByLabelText('Loading module')).toBeBusy();
  });
});
