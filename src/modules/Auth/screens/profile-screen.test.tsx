import { render, screen, userEvent, within } from '@testing-library/react-native';

import { useAuthStore } from '@/core/auth';
import { ConfirmProvider } from '@/shared/ui';

import { ProfileScreen } from './profile-screen';

jest.mock('@/core/config', () => ({ env: { apiUrl: 'https://example.test/api' } }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (href: string) => mockPush(href) } }));

const signOut = jest.fn();

beforeEach(() => {
  mockPush.mockReset();
  signOut.mockReset().mockResolvedValue(undefined);
  useAuthStore.setState({
    status: 'authenticated',
    user: {
      id: 1,
      name: 'Diana Larussa',
      email: 'diana@example.test',
      profile_photo_path: null,
      profile_photo_url: 'https://placeholder.test/dl.png',
    },
    roles: ['Sales', 'Admin'],
    signOut,
  });
});

describe('ProfileScreen', () => {
  it('shows the name with the first role and how many more, and the initials without a photo', async () => {
    await render(
      <ConfirmProvider>
        <ProfileScreen />
      </ConfirmProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Diana Larussa' })).toBeOnTheScreen();
    expect(screen.getByText('Sales +1')).toBeOnTheScreen();
    expect(screen.getByText('DL')).toBeOnTheScreen();
  });

  it('opens edit profile from the avatar and from the list, and change password from the list', async () => {
    await render(
      <ConfirmProvider>
        <ProfileScreen />
      </ConfirmProvider>,
    );

    const editButtons = screen.getAllByRole('button', { name: 'Edit profile' });
    expect(editButtons).toHaveLength(2);
    for (const button of editButtons) await userEvent.press(button);
    await userEvent.press(screen.getByRole('button', { name: 'Change password' }));

    expect(mockPush.mock.calls.map(([href]) => href)).toEqual([
      '/edit-profile',
      '/edit-profile',
      '/change-password',
    ]);
  });

  it('signs out only after the user confirms', async () => {
    await render(
      <ConfirmProvider>
        <ProfileScreen />
      </ConfirmProvider>,
    );

    await userEvent.press(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).not.toHaveBeenCalled();

    await userEvent.press(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sign out' }),
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
