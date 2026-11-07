import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

function subscribe(onChange: () => void) {
  const subscription = Dimensions.addEventListener('change', onChange);
  return () => subscription.remove();
}

/** Whether the window is at least `minWidth` wide. Starts false when rendered on the server. */
export function useMediaQuery({ minWidth }: { minWidth: number }) {
  return useSyncExternalStore(
    subscribe,
    () => Dimensions.get('window').width >= minWidth,
    () => false,
  );
}
