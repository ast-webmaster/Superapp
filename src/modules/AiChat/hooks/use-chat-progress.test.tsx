import { act, renderHook } from '@testing-library/react-native';

import { aiChatApi } from '../api/aiChatApi';
import { useChatProgress } from './use-chat-progress';

jest.mock('../api/aiChatApi', () => ({ aiChatApi: { progress: jest.fn() } }));

const progress = aiChatApi.progress as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  progress.mockReset().mockResolvedValue({
    steps: [{ key: 'select_groups', label: 'Mencari data yang relevan', status: 'running' }],
    done: false,
  });
});

afterEach(() => jest.useRealTimers());

const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

it('polls fast at first, then slower, and returns the steps', async () => {
  const { result } = await renderHook(() => useChatProgress('t-1'));

  await advance(699);
  expect(progress).not.toHaveBeenCalled();
  await advance(1);
  expect(progress).toHaveBeenCalledWith('t-1', expect.anything());
  expect(result.current).toEqual([
    { key: 'select_groups', label: 'Mencari data yang relevan', status: 'running' },
  ]);

  await advance(700 * 9);
  expect(progress).toHaveBeenCalledTimes(10);
  await advance(1799);
  expect(progress).toHaveBeenCalledTimes(10);
  await advance(1);
  expect(progress).toHaveBeenCalledTimes(11);
});

it('keeps polling when a poll fails', async () => {
  progress.mockRejectedValueOnce(new Error('offline'));
  await renderHook(() => useChatProgress('t-1'));

  await advance(1400);

  expect(progress).toHaveBeenCalledTimes(2);
});

it('stops when there is no send', async () => {
  const { rerender, result } = await renderHook(
    ({ trace }: { trace: string | null }) => useChatProgress(trace),
    { initialProps: { trace: 't-1' as string | null } },
  );
  await advance(700);
  expect(progress).toHaveBeenCalledTimes(1);

  await rerender({ trace: null });
  await advance(10_000);

  expect(progress).toHaveBeenCalledTimes(1);
  expect(result.current).toEqual([]);
});
