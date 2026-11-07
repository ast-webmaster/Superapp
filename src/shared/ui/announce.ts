import { AccessibilityInfo, Platform } from 'react-native';

/** iOS has no live regions, so `aria-live` and `role="alert"` need an explicit announcement there. */
export function announce(message: string) {
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
}
