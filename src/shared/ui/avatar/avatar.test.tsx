import { render, screen } from '@testing-library/react-native';

import { Avatar, initials } from './avatar';

describe('initials', () => {
  it('takes the first and last word, in capitals', () => {
    expect(initials('Diana Larussa')).toBe('DL');
    expect(initials('  budi  santoso  wijaya ')).toBe('BW');
  });

  it('uses one letter for a one-word name and none for an empty one', () => {
    expect(initials('Budi')).toBe('B');
    expect(initials('')).toBe('');
  });
});

describe('Avatar', () => {
  it('shows the initials without a photo, named after the person', async () => {
    await render(<Avatar name="Diana Larussa" />);

    expect(screen.getByLabelText('Diana Larussa')).toBeOnTheScreen();
    expect(screen.getByText('DL')).toBeOnTheScreen();
  });

  it('shows the photo instead of the initials when it has one', async () => {
    await render(<Avatar name="Diana Larussa" uri="https://example.test/a.jpg" />);

    expect(screen.queryByText('DL')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Diana Larussa')).toBeOnTheScreen();
  });
});
