import { render, screen, userEvent } from '@testing-library/react-native';

import { OptionRow } from './option-row';

describe('OptionRow', () => {
  it('names itself from the label and caption and reports a press', async () => {
    const onPress = jest.fn();
    await render(<OptionRow label="Jakarta" caption="JKT" onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: /Jakarta/ }));

    expect(onPress).toHaveBeenCalled();
    expect(screen.getByText('JKT')).toBeOnTheScreen();
  });

  it('tells screen readers whether a choice is checked', async () => {
    await render(
      <>
        <OptionRow role="radio" label="Russian" selected onPress={jest.fn()} />
        <OptionRow role="radio" label="English" selected={false} onPress={jest.fn()} />
      </>,
    );

    expect(screen.getByRole('radio', { name: /Russian/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /English/ })).not.toBeChecked();
  });

  it('does nothing while disabled', async () => {
    const onPress = jest.fn();
    await render(<OptionRow label="Jakarta" disabled onPress={onPress} />);

    await userEvent.press(screen.getByRole('button', { name: /Jakarta/ }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
