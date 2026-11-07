import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Screen } from './screen';

describe('Screen', () => {
  it('renders its content', async () => {
    await render(
      <Screen>
        <Text>Hello</Text>
      </Screen>,
    );

    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });
});
