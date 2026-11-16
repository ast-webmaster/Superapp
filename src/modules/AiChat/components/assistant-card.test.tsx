import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ChatMessage } from '../types';
import { AssistantCard } from './assistant-card';

const reply = (meta: Partial<NonNullable<ChatMessage['meta']>>): ChatMessage => ({
  uuid: 'm-1',
  role: 'assistant',
  message: 'Stok **12** unit',
  meta: { type: null, suggestions: [], assumptions: [], exportable: false, ...meta },
  created_at: '2026-11-14T07:00:00Z',
  attachments: [],
});

it('offers the Excel download when the answer is exportable', async () => {
  const onExport = jest.fn();
  await render(<AssistantCard message={reply({ exportable: true })} onExport={onExport} />);

  await fireEvent.press(screen.getByRole('button', { name: 'Download Excel' }));

  expect(onExport).toHaveBeenCalled();
});

it('has no download when the answer is not exportable', async () => {
  await render(<AssistantCard message={reply({ exportable: false })} onExport={jest.fn()} />);

  expect(screen.queryByText('Download Excel')).toBeNull();
});

it('shows assumptions and never the suggestions', async () => {
  await render(
    <AssistantCard
      message={reply({ suggestions: ['Shift 30 min'], assumptions: ['Periode bulan ini'] })}
    />,
  );

  expect(screen.getByText('Periode bulan ini')).toBeTruthy();
  expect(screen.queryByText('Shift 30 min')).toBeNull();
});

it('renders the reply text', async () => {
  await render(<AssistantCard message={reply({})} />);

  expect(screen.getByText('12')).toBeTruthy();
});
