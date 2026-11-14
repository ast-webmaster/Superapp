import { render, screen } from '@testing-library/react-native';

import { AppText } from '../text/text';
import { ActionBar } from './action-bar';

it('renders its actions', async () => {
  await render(
    <ActionBar>
      <AppText>Save</AppText>
    </ActionBar>,
  );

  expect(screen.getByText('Save')).toBeTruthy();
});
