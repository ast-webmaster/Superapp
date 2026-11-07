import { useRef, type ComponentRef } from 'react';
import { Platform, type Pressable, type PressableProps } from 'react-native';

type KeyDownEvent = Parameters<NonNullable<PressableProps['onKeyDown']>>[0];

const previousKeys = ['ArrowLeft', 'ArrowUp'];
const nextKeys = ['ArrowRight', 'ArrowDown'];

/**
 * Keyboard behaviour for a single-select group: one tab stop, arrow keys and Home/End move
 * between options and select them. Keyboard focus only applies on web.
 */
export function useRovingFocus(
  count: number,
  selectedIndex: number,
  onMove: (index: number) => void,
) {
  const elements = useRef<(ComponentRef<typeof Pressable> | null)[]>([]);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const itemProps = (index: number) => ({
    ref: (element: ComponentRef<typeof Pressable> | null) => {
      elements.current[index] = element;
    },
    onKeyDown: (event: KeyDownEvent) => {
      const { key } = event.nativeEvent;
      let target: number | undefined;
      if (previousKeys.includes(key)) target = (index - 1 + count) % count;
      if (nextKeys.includes(key)) target = (index + 1) % count;
      if (key === 'Home') target = 0;
      if (key === 'End') target = count - 1;
      if (target === undefined) return;

      event.preventDefault();
      onMove(target);
      elements.current[target]?.focus();
    },
    ...(Platform.OS === 'web'
      ? { tabIndex: index === tabStop ? (0 as const) : (-1 as const) }
      : {}),
  });

  return itemProps;
}
