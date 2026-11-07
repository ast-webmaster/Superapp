import { render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { TextField } from './text-field';

describe('TextField', () => {
  afterEach(() => jest.restoreAllMocks());

  it('works uncontrolled', async () => {
    await render(<TextField label="Name" defaultValue="Budi" />);

    const input = screen.getByLabelText('Name');
    await userEvent.type(input, ' Santoso');

    expect(input).toHaveDisplayValue('Budi Santoso');
  });

  it('works controlled', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Name" value="Budi" onChangeText={onChangeText} />);

    const input = screen.getByLabelText('Name');
    await userEvent.type(input, '!');

    expect(onChangeText).toHaveBeenCalledWith('Budi!');
    expect(input).toHaveDisplayValue('Budi');
  });

  it('falls back to the placeholder as the accessible name', async () => {
    await render(<TextField placeholder="Departments" />);

    expect(screen.getByLabelText('Departments')).toBeOnTheScreen();
  });

  it('shows and hides a password', async () => {
    await render(<TextField label="Password" type="password" defaultValue="secret" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveProp('secureTextEntry', true);

    await userEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveProp('secureTextEntry', false);

    await userEvent.press(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveProp('secureTextEntry', true);
  });

  it('announces an error and links it to the field', async () => {
    const speak = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(<TextField label="Email" error="Enter a valid email" />);

    const input = screen.getByLabelText('Email');
    expect(screen.getByText('Enter a valid email')).toBeOnTheScreen();
    expect(input).toHaveProp('aria-invalid', true);
    expect(input).toHaveProp('accessibilityHint', 'Enter a valid email');
    expect(speak).toHaveBeenCalledWith('Enter a valid email');
  });

  it('shows help when there is no error', async () => {
    await render(<TextField label="Email" help="Use your work email" />);

    expect(screen.getByText('Use your work email')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toHaveProp('aria-invalid', false);
  });
});
