import { render, screen } from '@testing-library/react-native';

import { ProductImage } from './product-image';

describe('ProductImage', () => {
  it('draws a placeholder when there is no picture', async () => {
    await render(<ProductImage uri={null} className="size-16" />);

    expect(screen.toJSON()).not.toBeNull();
  });

  it('is hidden from screen readers, because the name beside it carries the meaning', async () => {
    await render(<ProductImage uri="https://example.test/a.jpg" className="size-16" />);

    expect(screen.queryByRole('image')).toBeNull();
  });
});
