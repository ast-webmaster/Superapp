import { useCallback, useRef } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** How close to the end still counts as "reading the latest". */
const NEAR_END = 48;

/**
 * Keeps the conversation on its newest message while the user is at the bottom, and leaves them
 * where they are once they scroll up to read (progress steps change the size every second).
 */
export function useFollowLatest<T>() {
  const listRef = useRef<FlatList<T>>(null);
  const atEnd = useRef(true);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    atEnd.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - NEAR_END;
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (atEnd.current) listRef.current?.scrollToEnd({ animated: true });
  }, []);

  /** Back to the newest message, such as right after the user sends. */
  const followNow = useCallback(() => {
    atEnd.current = true;
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  return { listRef, onScroll, onContentSizeChange, followNow };
}
