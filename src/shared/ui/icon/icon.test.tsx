import { render, screen } from '@testing-library/react-native';

import { Icon, iconNames } from './icon';

describe('Icon', () => {
  it('renders every icon in the set', async () => {
    for (const name of iconNames) {
      await render(<Icon name={name} label={name} />);
      expect(screen.getByLabelText(name)).toBeOnTheScreen();
    }
  });

  it('is hidden from screen readers without a label', async () => {
    await render(<Icon name="home" />);

    expect(screen.queryByRole('img')).toBeNull();
  });

  it('is exposed as an image when it has a label', async () => {
    await render(<Icon name="bell" label="Notifications" />);

    expect(screen.getByRole('img', { name: 'Notifications' })).toBeOnTheScreen();
  });
});
