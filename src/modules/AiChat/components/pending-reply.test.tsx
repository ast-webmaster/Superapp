import { render, screen } from '@testing-library/react-native';

import { PendingReply } from './pending-reply';

it('says Thinking before the first step arrives', async () => {
  await render(<PendingReply steps={[]} />);

  expect(screen.getByText('Thinking')).toBeTruthy();
});

it('lists the steps the server reported', async () => {
  await render(
    <PendingReply
      steps={[
        { key: 'detect_intent', label: 'Mengenali jenis pertanyaan', status: 'success' },
        { key: 'select_groups', label: 'Mencari data yang relevan', status: 'running' },
      ]}
    />,
  );

  expect(screen.getByText('Mengenali jenis pertanyaan')).toBeTruthy();
  expect(screen.getByText('Mencari data yang relevan')).toBeTruthy();
  expect(screen.queryByText('Thinking')).toBeNull();
});
