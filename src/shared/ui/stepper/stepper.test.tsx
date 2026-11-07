import { render, screen, userEvent } from '@testing-library/react-native';

import { Stepper } from './stepper';

function button(name: string) {
  return screen.getByRole('button', { name });
}

describe('Stepper', () => {
  it('steps up and down', async () => {
    const onChange = jest.fn();
    await render(<Stepper label="Quantity" defaultValue={1} onChange={onChange} />);

    await userEvent.press(button('Increase Quantity'));
    expect(screen.getByText('2')).toBeOnTheScreen();

    await userEvent.press(button('Decrease Quantity'));
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('disables its buttons at the limits', async () => {
    const onChange = jest.fn();
    await render(<Stepper label="Quantity" defaultValue={1} min={1} max={2} onChange={onChange} />);

    expect(button('Decrease Quantity')).toBeDisabled();

    await userEvent.press(button('Decrease Quantity'));
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.press(button('Increase Quantity'));
    expect(button('Increase Quantity')).toBeDisabled();
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('clamps a starting value outside the limits', async () => {
    await render(<Stepper label="Quantity" value={99} min={0} max={10} />);

    expect(screen.getByText('10')).toBeOnTheScreen();
  });

  it('marks the value as a live region', async () => {
    await render(<Stepper label="Quantity" defaultValue={3} />);

    expect(screen.getByText('3')).toHaveProp('aria-live', 'polite');
  });
});
