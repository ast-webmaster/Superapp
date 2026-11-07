import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { Chip, ChipGroup } from './chip';

const options = [
  { value: 'all', label: 'All apps' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'recent', label: 'Recent' },
];

function chip(name: string) {
  return screen.getByRole('button', { name });
}

function pressKey(name: string, key: string) {
  return fireEvent(chip(name), 'keyDown', { nativeEvent: { key }, preventDefault: jest.fn() });
}

describe('Chip', () => {
  it('exposes its selected state', async () => {
    await render(<Chip selected label="Sales" icon="chart" />);

    expect(chip('Sales')).toBeSelected();
    expect(chip('Sales')).toHaveProp('aria-pressed', true);
  });
});

describe('ChipGroup', () => {
  it('selects one chip at a time', async () => {
    const onChange = jest.fn();
    await render(
      <ChipGroup label="Filter" options={options} defaultValue="all" onChange={onChange} />,
    );

    await userEvent.press(chip('Recent'));

    expect(onChange).toHaveBeenCalledWith('recent');
    expect(chip('Recent')).toBeSelected();
    expect(chip('All apps')).not.toBeSelected();
  });

  it('moves with the arrow keys and wraps around', async () => {
    await render(<ChipGroup label="Filter" options={options} defaultValue="all" />);

    await pressKey('All apps', 'ArrowRight');
    expect(chip('Favorites')).toBeSelected();

    await pressKey('Favorites', 'ArrowLeft');
    expect(chip('All apps')).toBeSelected();

    await pressKey('All apps', 'ArrowLeft');
    expect(chip('Recent')).toBeSelected();
  });

  it('jumps with Home and End and ignores other keys', async () => {
    const onChange = jest.fn();
    await render(
      <ChipGroup label="Filter" options={options} defaultValue="all" onChange={onChange} />,
    );

    await pressKey('All apps', 'End');
    expect(chip('Recent')).toBeSelected();

    await pressKey('Recent', 'Home');
    expect(chip('All apps')).toBeSelected();

    onChange.mockClear();
    await pressKey('All apps', 'a');
    expect(onChange).not.toHaveBeenCalled();
  });
});
