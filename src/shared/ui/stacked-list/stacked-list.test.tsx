import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { StackedList } from './stacked-list';

describe('StackedList', () => {
  it('renders every item through the list', async () => {
    await render(
      <StackedList
        data={['First', 'Second']}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text>{item}</Text>}
      />,
    );

    expect(screen.getByText('First')).toBeOnTheScreen();
    expect(screen.getByText('Second')).toBeOnTheScreen();
  });
});
