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

const clarify = reply({
  type: 'clarify',
  suggestions: ['Penjualan Juni', 'Pencapaian target Juni'],
});

it('offers the options of a clarifying question and sends the picked one', async () => {
  const onChoose = jest.fn();
  await render(<AssistantCard message={clarify} onChoose={onChoose} />);

  expect(screen.getByRole('button', { name: 'Send answer' })).toBeDisabled();

  await fireEvent.press(screen.getByRole('radio', { name: 'Pencapaian target Juni' }));
  expect(screen.getByRole('radio', { name: 'Pencapaian target Juni' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'Penjualan Juni' })).not.toBeChecked();

  await fireEvent.press(screen.getByRole('button', { name: 'Send answer' }));

  expect(onChoose).toHaveBeenCalledWith('Pencapaian target Juni');
});

it('hides the options once the question is no longer open', async () => {
  await render(<AssistantCard message={clarify} />);

  expect(screen.queryByRole('radio')).toBeNull();
});

it('shows no options for answers that are not a clarifying question', async () => {
  await render(
    <AssistantCard
      message={reply({ type: 'data_query', suggestions: ['Bandingkan dengan bulan lalu'] })}
      onChoose={jest.fn()}
    />,
  );

  expect(screen.queryByRole('radio')).toBeNull();
  expect(screen.queryByText('Bandingkan dengan bulan lalu')).toBeNull();
});

it('renders the reply text', async () => {
  await render(<AssistantCard message={reply({})} />);

  expect(screen.getByText('12')).toBeTruthy();
});
