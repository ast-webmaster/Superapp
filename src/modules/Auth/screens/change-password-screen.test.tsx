import { render, screen, userEvent } from '@testing-library/react-native';

import { useAuthStore } from '@/core/auth';
import { AppError } from '@/core/errors';

import { ChangePasswordScreen } from './change-password-screen';

jest.mock('@/core/config', () => ({ env: { apiUrl: 'https://example.test/api' } }));

const changePassword = jest.fn();

async function fill(current: string, next: string, confirmation: string) {
  await userEvent.type(screen.getByLabelText('Current password'), current);
  await userEvent.type(screen.getByLabelText('New password'), next);
  await userEvent.type(screen.getByLabelText('Confirm new password'), confirmation);
  await userEvent.press(screen.getByRole('button', { name: 'Change password' }));
}

beforeEach(() => {
  changePassword.mockReset().mockResolvedValue(undefined);
  useAuthStore.setState({ changePassword });
});

describe('ChangePasswordScreen', () => {
  it('does not send a request when the confirmation differs', async () => {
    await render(<ChangePasswordScreen />);

    await fill('old-pass', 'new-pass-1', 'new-pass-2');

    expect(screen.getByText('The passwords do not match.')).toBeOnTheScreen();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('does not send a request without the current password', async () => {
    await render(<ChangePasswordScreen />);

    await fill('', 'new-pass-1', 'new-pass-1');

    expect(screen.getByText('Enter your current password.')).toBeOnTheScreen();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('sends the three passwords, then says the other devices were signed out', async () => {
    await render(<ChangePasswordScreen />);

    await fill('old-pass', 'new-pass-1', 'new-pass-1');

    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass',
      password: 'new-pass-1',
      passwordConfirmation: 'new-pass-1',
    });
    expect(
      await screen.findByText('Password changed. Your other devices were signed out.'),
    ).toBeOnTheScreen();
  });

  it('shows the server message under the field it belongs to', async () => {
    changePassword.mockRejectedValue(
      new AppError('Validasi gagal', 'validation', 422, {
        current_password: ['Password saat ini salah.'],
      }),
    );
    await render(<ChangePasswordScreen />);

    await fill('wrong', 'new-pass-1', 'new-pass-1');

    expect(await screen.findByText('Password saat ini salah.')).toBeOnTheScreen();
  });
});
