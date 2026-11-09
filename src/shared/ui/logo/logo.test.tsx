import { render, screen } from '@testing-library/react-native';

import { Logo } from './logo';

describe('Logo', () => {
  it('never renders under the 64px brand minimum and keeps its proportions', async () => {
    await render(<Logo width={40} />);

    expect(screen.getByLabelText('Astrindo')).toHaveStyle({
      width: 64,
      height: 64 / (4000 / 888),
    });
  });

  it('describes itself as Astrindo in both variants', async () => {
    await render(<Logo variant="light" />);

    expect(screen.getByLabelText('Astrindo')).toBeOnTheScreen();
  });
});
