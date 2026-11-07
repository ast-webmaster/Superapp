import { render, screen, userEvent } from '@testing-library/react-native';

import { InfoCard } from './info-card';

describe('InfoCard', () => {
  it('is one button that reads its title and description', async () => {
    const onPress = jest.fn();
    await render(
      <InfoCard
        icon="chat"
        title="Ask the HR helpdesk"
        description="Leave, payslip, policies and more."
        onPress={onPress}
      />,
    );

    const card = screen.getByRole('button', { name: /Ask the HR helpdesk/ });
    expect(card).toHaveTextContent(/Leave, payslip, policies and more\./);

    await userEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
