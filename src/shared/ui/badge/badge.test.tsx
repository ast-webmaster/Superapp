import { render, screen } from '@testing-library/react-native';

import { Badge } from './badge';

describe('Badge', () => {
  it.each(['neutral', 'info', 'success', 'danger', 'warning'] as const)(
    'always carries its word in the %s tone',
    async (tone) => {
      await render(<Badge label="Overdue" tone={tone} icon="alert" />);

      expect(screen.getByText('Overdue')).toBeOnTheScreen();
    },
  );
});
