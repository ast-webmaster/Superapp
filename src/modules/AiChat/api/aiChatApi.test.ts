import { apiClient } from '@/core/api';
import type { PickedFile } from '@/core/files';

import { aiChatApi } from './aiChatApi';

jest.mock('@/core/api', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), getFile: jest.fn() },
}));
jest.mock('@/core/files', () => ({
  toUploadBlob: jest.fn(async (file: { name: string }) => new Blob([file.name])),
}));

const post = apiClient.post as jest.Mock;
const getFile = apiClient.getFile as jest.Mock;

const file = (name: string): PickedFile => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size: 10,
});

beforeEach(() => {
  post.mockReset().mockResolvedValue({ data: { reply: 'ok' } });
  getFile.mockReset().mockResolvedValue(new Uint8Array([1]));
});

it('send without files posts JSON {message, trace_id}', async () => {
  await aiChatApi.send({ sessionUuid: 's-1', message: 'Hi', files: [], traceId: 't-1' });

  expect(post).toHaveBeenCalledWith(
    '/ai-chat/sessions/s-1/messages',
    { message: 'Hi', trace_id: 't-1' },
    expect.objectContaining({ timeoutMs: 180000 }),
  );
});

it('send with files posts FormData with attachments[]', async () => {
  await aiChatApi.send({
    sessionUuid: 's-1',
    message: 'Hi',
    files: [file('a.pdf'), file('b.png')],
    traceId: 't-1',
  });

  const [path, body, options] = post.mock.calls[0];
  expect(path).toBe('/ai-chat/sessions/s-1/messages');
  expect(body).toBeInstanceOf(FormData);
  expect((body as FormData).getAll('attachments[]')).toHaveLength(2);
  expect((body as FormData).get('message')).toBe('Hi');
  expect((body as FormData).get('trace_id')).toBe('t-1');
  expect(options).toEqual(expect.objectContaining({ timeoutMs: 180000 }));
});

it('send returns the data of the envelope', async () => {
  await expect(
    aiChatApi.send({ sessionUuid: 's-1', message: 'Hi', files: [], traceId: 't-1' }),
  ).resolves.toEqual({ reply: 'ok' });
});

it('attachment downloads by uuid', async () => {
  await aiChatApi.attachment('a-1');

  expect(getFile).toHaveBeenCalledWith('/ai-chat/attachments/a-1');
});
