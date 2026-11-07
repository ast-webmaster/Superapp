import { act, renderHook } from '@testing-library/react-native';

import { useControllableState } from './use-controllable-state';

describe('useControllableState', () => {
  it('keeps its own state when uncontrolled', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() => useControllableState({ defaultValue: 1, onChange }));

    await act(async () => result.current[1](2));

    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('follows the passed value when controlled', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      useControllableState({ value: 1, defaultValue: 0, onChange }),
    );

    await act(async () => result.current[1](2));

    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not report a change when the value stays the same', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() => useControllableState({ defaultValue: 1, onChange }));

    await act(async () => result.current[1](1));

    expect(onChange).not.toHaveBeenCalled();
  });
});
