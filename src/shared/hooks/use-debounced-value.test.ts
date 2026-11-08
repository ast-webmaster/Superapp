import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('keeps the old value until the new one has settled', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'a' } },
    );

    await rerender({ value: 'ab' });
    await act(async () => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe('a');

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ab');
  });
});
