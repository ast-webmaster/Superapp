import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { DateRangePicker, type DateRange } from './date-range-picker';

let latest: DateRange = { from: null, to: null };

function Harness({ maxDays }: { maxDays?: number }) {
  const [value, setValue] = useState<DateRange>({ from: null, to: null });
  return (
    <DateRangePicker
      maxDays={maxDays}
      initialMonth="2026-11-01"
      value={value}
      onChange={(next) => {
        latest = next;
        setValue(next);
      }}
    />
  );
}

const day = (n: number) => screen.getByRole('button', { name: `${n} November 2026` });

describe('DateRangePicker', () => {
  it('picks a start and an end, and a tap before the start moves the start', async () => {
    await render(<Harness />);

    await userEvent.press(day(10));
    expect(latest).toEqual({ from: '2026-11-10', to: null });

    await userEvent.press(day(20));
    expect(latest).toEqual({ from: '2026-11-10', to: '2026-11-20' });

    await userEvent.press(day(5));
    expect(latest).toEqual({ from: '2026-11-05', to: null });
  });

  it('allows a single day by tapping it twice', async () => {
    await render(<Harness />);

    await userEvent.press(day(12));
    await userEvent.press(day(12));

    expect(latest).toEqual({ from: '2026-11-12', to: '2026-11-12' });
  });

  it('disables days past the longest range once a start is chosen', async () => {
    await render(<Harness maxDays={5} />);

    await userEvent.press(day(10));

    expect(day(14)).toBeEnabled();
    expect(day(15)).toBeDisabled();
    await userEvent.press(day(15));
    expect(latest).toEqual({ from: '2026-11-10', to: null });
  });

  it('moves between months', async () => {
    await render(<Harness />);

    await userEvent.press(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('December 2026')).toBeOnTheScreen();
  });
});
