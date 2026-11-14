import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { pickFile, type PickedFile } from '@/core/files';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ToastProvider } from '@/shared/ui';

import { Composer, type ComposerProps } from './composer';

jest.mock('@/core/files', () => ({ pickFile: jest.fn() }));
jest.mock('@/shared/hooks/use-is-online', () => ({ useIsOnline: jest.fn() }));

const pick = pickFile as jest.Mock;
const online = useIsOnline as jest.Mock;

const file = (name: string): PickedFile => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size: 1000,
});

async function renderComposer(props: Partial<ComposerProps> = {}) {
  const handlers = { onChangeText: jest.fn(), onChangeFiles: jest.fn(), onSend: jest.fn() };
  await render(
    <ToastProvider>
      <Composer
        value=""
        files={[]}
        busy={false}
        mic={<Text>mic-slot</Text>}
        {...handlers}
        {...props}
      />
    </ToastProvider>,
  );
  return handlers;
}

beforeEach(() => {
  pick.mockReset();
  online.mockReset().mockReturnValue(true);
});

it('shows the mic instead of send when there is nothing to send', async () => {
  await renderComposer();

  expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  expect(screen.getByText('mic-slot')).toBeTruthy();
});

it('sends the text', async () => {
  const { onSend } = await renderComposer({ value: 'Hi' });

  await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

  expect(onSend).toHaveBeenCalled();
});

it('can send files without text', async () => {
  await renderComposer({ files: [file('a.pdf')] });

  expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
});

it('cannot send offline and says why', async () => {
  online.mockReturnValue(false);
  const { onSend } = await renderComposer({ value: 'Hi' });

  await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

  expect(onSend).not.toHaveBeenCalled();
  expect(screen.getByText('You are offline. Connect to send a message.')).toBeTruthy();
});

it('cannot send while the last message is on its way', async () => {
  const { onSend } = await renderComposer({ value: 'Hi', busy: true });

  await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

  expect(onSend).not.toHaveBeenCalled();
});

it('refuses a fourth file', async () => {
  pick.mockResolvedValueOnce(file('d.pdf'));
  const { onChangeFiles } = await renderComposer({
    files: [file('a.pdf'), file('b.pdf'), file('c.pdf')],
  });

  await fireEvent.press(screen.getByRole('button', { name: 'Attach file' }));

  await waitFor(() => expect(screen.getByText('You can attach up to 3 files.')).toBeTruthy());
  expect(onChangeFiles).not.toHaveBeenCalled();
});

it('adds a valid file', async () => {
  pick.mockResolvedValueOnce(file('b.pdf'));
  const { onChangeFiles } = await renderComposer({ files: [file('a.pdf')] });

  await fireEvent.press(screen.getByRole('button', { name: 'Attach file' }));

  await waitFor(() => expect(onChangeFiles).toHaveBeenCalledWith([file('a.pdf'), file('b.pdf')]));
});

it('removes a file', async () => {
  const { onChangeFiles } = await renderComposer({ files: [file('a.pdf'), file('b.pdf')] });

  await fireEvent.press(screen.getByRole('button', { name: 'Remove a.pdf' }));

  expect(onChangeFiles).toHaveBeenCalledWith([file('b.pdf')]);
});

it('keeps the mic as a stop button while listening, even once words fill the field', async () => {
  await renderComposer({ value: 'halo', listening: true });

  expect(screen.getByText('mic-slot')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
});
