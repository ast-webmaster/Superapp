import { fireEvent, render, screen } from '@testing-library/react-native';

import type { InboxItem } from '../types';
import { InboxRow } from './inbox-row';

const item: InboxItem = {
  id: 'n1',
  module: 'price-approval',
  doc_uuid: 'doc-1',
  status: 'AWAITING',
  tier: 'PRODUCT MANAGER',
  title: 'PA-001',
  subtitle: 'Customer A',
  created_at: '2026-11-09T10:05:00+07:00',
};

it('shows the document, its customer and date, and its status in sentence case', async () => {
  await render(<InboxRow item={item} />);

  expect(screen.getByText('PA-001')).toBeOnTheScreen();
  expect(screen.getByText('Customer A · 9 Nov 2026 10:05')).toBeOnTheScreen();
  expect(screen.getByText('Awaiting')).toBeOnTheScreen();
});

it('opens the document when pressed', async () => {
  const onPress = jest.fn();
  await render(<InboxRow item={item} onPress={onPress} />);

  fireEvent.press(screen.getByRole('button'));

  expect(onPress).toHaveBeenCalledTimes(1);
});

it('is not a button without a way to open it', async () => {
  await render(<InboxRow item={item} />);

  expect(screen.queryByRole('button')).toBeNull();
});

it('says so when the document is gone, and still shows what it can', async () => {
  await render(<InboxRow item={{ ...item, title: null, subtitle: null, created_at: null }} />);

  expect(screen.getByText('Document no longer available')).toBeOnTheScreen();
  expect(screen.getByText('Awaiting')).toBeOnTheScreen();
});
