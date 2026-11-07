import { render, screen } from '@testing-library/react-native';

import { Button } from '../button/button';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('shows the title, the description and the next step', async () => {
    await render(
      <EmptyState title="Nothing here" description="No requests yet.">
        <Button>Try again</Button>
      </EmptyState>,
    );

    expect(screen.getByText('Nothing here')).toBeOnTheScreen();
    expect(screen.getByText('No requests yet.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  });

  it('leaves out the description when there is none', async () => {
    await render(<EmptyState title="Nothing here" />);

    expect(screen.getByText('Nothing here')).toBeOnTheScreen();
    expect(screen.queryByText('No requests yet.')).not.toBeOnTheScreen();
  });
});
