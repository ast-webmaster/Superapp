import { render, screen } from '@testing-library/react-native';

import { ProgressBar } from './progress-bar';

describe('ProgressBar', () => {
  it('is announced as a busy progress bar with its label', async () => {
    await render(<ProgressBar label="Downloading report.pdf" />);

    const bar = screen.getByRole('progressbar', { name: 'Downloading report.pdf' });

    expect(bar).toBeOnTheScreen();
    expect(bar).toBeBusy();
  });
});
