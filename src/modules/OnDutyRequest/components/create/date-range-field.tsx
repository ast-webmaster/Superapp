import { useState } from 'react';

import { DateRangePicker, Sheet, type DateRange } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { PickerField } from './picker-field';

export interface DateRangeFieldProps {
  label: string;
  required?: boolean;
  /** YYYY-MM-DD, or null while nothing is chosen. */
  start: string | null;
  end: string | null;
  onChange: (range: { start: string; end: string }) => void;
  error?: string;
  help?: string;
}

/** A first and a last day chosen on one month calendar. The sheet closes on the second tap. */
export function DateRangeField({
  label,
  required,
  start,
  end,
  onChange,
  error,
  help,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  // The first tap alone is not a range yet, so it waits here until the second tap.
  const [pending, setPending] = useState<DateRange>({ from: start, to: end });

  const value = start && end ? `${formatDate(start)} - ${formatDate(end)}` : null;

  return (
    <>
      <PickerField
        label={label}
        required={required}
        value={value}
        placeholder="Choose the first and the last day"
        onPress={() => {
          setPending({ from: start, to: end });
          setOpen(true);
        }}
        error={error}
        help={help}
      />
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        <DateRangePicker
          value={pending}
          onChange={(range) => {
            setPending(range);
            if (range.from !== null && range.to !== null) {
              onChange({ start: range.from, end: range.to });
              setOpen(false);
            }
          }}
        />
      </Sheet>
    </>
  );
}
