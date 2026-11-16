import { render, screen } from '@testing-library/react-native';

import { usePermissions } from '@/core/auth';

import { AiChatScreen } from './ai-chat-screen';

jest.mock('@/core/auth', () => ({ usePermissions: jest.fn() }));
// The chat itself is tested in its module; here only the choice between the two pages matters.
jest.mock('@/modules/AiChat', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    AI_CHAT_PERMISSIONS: ['read_aichat', 'read_all_aichat'],
    AiChatScreen: () => <Text>The chat</Text>,
  };
});

const permissions = usePermissions as jest.Mock;

it('keeps the coming-soon page for users without an AI chat permission', async () => {
  permissions.mockReturnValue(['read_priceapproval']);
  await render(<AiChatScreen />);

  expect(screen.getByText('AI chat is coming soon')).toBeOnTheScreen();
  expect(screen.queryByText('The chat')).not.toBeOnTheScreen();
});

it('opens the chat for a user with an AI chat permission', async () => {
  permissions.mockReturnValue(['read_aichat']);
  await render(<AiChatScreen />);

  expect(screen.getByText('The chat')).toBeOnTheScreen();
  expect(screen.queryByText('AI chat is coming soon')).not.toBeOnTheScreen();
});
