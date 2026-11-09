import { render, screen, userEvent } from '@testing-library/react-native';

import { useAuthStore } from '@/core/auth';
import { AppError } from '@/core/errors';

import { EditProfileScreen } from './edit-profile-screen';

jest.mock('@/core/config', () => ({ env: { apiUrl: 'https://example.test/api' } }));

jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const updateProfile = jest.fn();

beforeEach(() => {
  updateProfile.mockReset().mockResolvedValue(undefined);
  useAuthStore.setState({
    status: 'authenticated',
    user: {
      id: 1,
      name: 'Diana Larussa',
      email: 'diana@example.test',
      profile_photo_path: null,
      profile_photo_url: 'https://placeholder.test/dl.png',
    },
    roles: ['Sales'],
    updateProfile,
  });
});

describe('EditProfileScreen', () => {
  it('shows the user data, with only the name editable', async () => {
    await render(<EditProfileScreen />);

    expect(screen.getByDisplayValue('Diana Larussa')).toBeOnTheScreen();
    expect(screen.getByText('diana@example.test')).toBeOnTheScreen();
    expect(screen.getByText('Sales')).toBeOnTheScreen();
    expect(screen.queryByDisplayValue('diana@example.test')).not.toBeOnTheScreen();
  });

  it('cannot save until something changed', async () => {
    await render(<EditProfileScreen />);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Name'), ' B');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  it('saves the trimmed name and confirms', async () => {
    await render(<EditProfileScreen />);

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), '  Diana L  ');
    await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateProfile).toHaveBeenCalledWith({ name: 'Diana L', photo: undefined });
    expect(await screen.findByText('Profile saved.')).toBeOnTheScreen();
  });

  it('refuses an empty name without calling the server', async () => {
    await render(<EditProfileScreen />);

    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Enter your name.')).toBeOnTheScreen();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('shows what went wrong when the save fails', async () => {
    updateProfile.mockRejectedValue(new AppError('Cannot reach the server.', 'network'));
    await render(<EditProfileScreen />);

    await userEvent.type(screen.getByLabelText('Name'), 'x');
    await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Cannot reach the server.')).toBeOnTheScreen();
  });
});
