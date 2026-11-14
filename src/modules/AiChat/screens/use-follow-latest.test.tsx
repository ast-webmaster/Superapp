import { act, renderHook } from '@testing-library/react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { useFollowLatest } from './use-follow-latest';

const scrolled = (offset: number, content = 2000, height = 800) =>
  ({
    nativeEvent: {
      contentOffset: { x: 0, y: offset },
      contentSize: { width: 400, height: content },
      layoutMeasurement: { width: 400, height },
    },
  }) as NativeSyntheticEvent<NativeScrollEvent>;

async function setup() {
  const scrollToEnd = jest.fn();
  const { result } = await renderHook(() => useFollowLatest());
  (result.current.listRef as { current: unknown }).current = { scrollToEnd };
  return { result, scrollToEnd };
}

it('follows new content while the user is at the bottom', async () => {
  const { result, scrollToEnd } = await setup();

  await act(() => result.current.onContentSizeChange());

  expect(scrollToEnd).toHaveBeenCalled();
});

it('leaves the user where they are after they scroll up to read', async () => {
  const { result, scrollToEnd } = await setup();

  await act(() => result.current.onScroll(scrolled(200)));
  await act(() => result.current.onContentSizeChange());

  expect(scrollToEnd).not.toHaveBeenCalled();
});

it('follows again once the user is back at the bottom', async () => {
  const { result, scrollToEnd } = await setup();

  await act(() => result.current.onScroll(scrolled(200)));
  await act(() => result.current.onScroll(scrolled(1180)));
  await act(() => result.current.onContentSizeChange());

  expect(scrollToEnd).toHaveBeenCalled();
});

it('jumps to the end when asked, such as after the user sends', async () => {
  const { result, scrollToEnd } = await setup();

  await act(() => result.current.onScroll(scrolled(200)));
  await act(() => result.current.followNow());

  expect(scrollToEnd).toHaveBeenCalled();
});
