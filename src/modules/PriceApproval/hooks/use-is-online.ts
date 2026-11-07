import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/** The connection state React Query uses (wired to expo-network in the query client). */
export function useIsOnline() {
  return useSyncExternalStore(subscribe, isOnline);
}
