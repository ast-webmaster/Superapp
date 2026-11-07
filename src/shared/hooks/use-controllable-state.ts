import { useState } from 'react';

interface ControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** The controlled/uncontrolled pattern: a passed `value` wins, otherwise the state is internal. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value !== undefined ? value : internal;

  const setValue = (next: T) => {
    if (value === undefined) setInternal(next);
    if (next !== current) onChange?.(next);
  };

  return [current, setValue] as const;
}
