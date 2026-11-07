import { render, screen } from '@testing-library/react-native';

import { Loading } from './loading';

describe('Loading', () => {
  it('is announced as a progress bar with a label', async () => {
    await render(<Loading label="Loading requests" />);

    expect(screen.getByRole('progressbar', { name: 'Loading requests' })).toBeOnTheScreen();
  });
});
