import { render, screen } from '@testing-library/react-native';

import { FailedSendRow } from './failed-send-row';

it('says the message may not have been sent when the outcome is unknown', async () => {
  await render(<FailedSendRow onRestore={jest.fn()} />);

  expect(screen.getByText('Your message may not have been sent. Try again.')).toBeOnTheScreen();
});

it('shows the server reason when the server refused the message', async () => {
  await render(<FailedSendRow error="File tidak bisa dibaca." onRestore={jest.fn()} />);

  expect(screen.getByText('File tidak bisa dibaca.')).toBeOnTheScreen();
});
