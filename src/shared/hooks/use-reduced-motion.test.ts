import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from './use-reduced-motion';

describe('useReducedMotion', () => {
  afterEach(() => jest.restoreAllMocks());

  it('reads the system setting and follows later changes', async () => {
    let notify: (enabled: boolean) => void = () => {};
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
      notify = handler as (enabled: boolean) => void;
      return { remove: jest.fn() } as never;
    });

    const { result } = await renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    await act(async () => notify(false));
    expect(result.current).toBe(false);
  });
});
