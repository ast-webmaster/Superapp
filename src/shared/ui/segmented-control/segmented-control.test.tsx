import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { SegmentedControl } from './segmented-control';

const options = [
  { value: 'list', label: 'List', icon: 'list' },
  { value: 'grid', label: 'Grid', icon: 'grid' },
] as const;

describe('SegmentedControl', () => {
  it('starts on the first option when uncontrolled and changes on press', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl label="View as" options={options} onChange={onChange} />);

    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();

    await userEvent.press(screen.getByRole('radio', { name: 'Grid' }));

    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith('grid');
  });

  it('follows the passed value when controlled', async () => {
    await render(<SegmentedControl label="View as" options={options} value="grid" />);

    await userEvent.press(screen.getByRole('radio', { name: 'List' }));

    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
  });

  it('moves with the arrow keys', async () => {
    await render(<SegmentedControl label="View as" options={options} />);

    await fireEvent(screen.getByRole('radio', { name: 'List' }), 'keyDown', {
      nativeEvent: { key: 'ArrowRight' },
      preventDefault: jest.fn(),
    });

    expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked();
  });
});
