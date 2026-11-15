import { useState } from 'react';

import { Button, DateRangePicker, Sheet } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { PickerField } from './picker-field';

export interface DateFieldProps {
  label: string;
  required?: boolean;
  /** YYYY-MM-DD, or null when nothing is chosen. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shows a button that empties an optional date. */
  clearable?: boolean;
  error?: string;
}

/** One day, chosen on a month calendar. The first tap picks it and closes the sheet. */
export function DateField({ label, required, value, onChange, clearable, error }: DateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PickerField
        label={label}
        required={required}
        value={value ? formatDate(value) : null}
        placeholder="Choose a date"
        onPress={() => setOpen(true)}
        error={error}
      />
      <Sheet
        visible={open}
        title={label}
        onClose={() => setOpen(false)}
        footer={
          clearable && value ? (
            <Button
              block
              variant="soft"
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}>
              Clear date
            </Button>
          ) : undefined
        }>
        <DateRangePicker
          value={{ from: value, to: value }}
          onChange={({ from }) => {
            if (from === null) return;
            onChange(from);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
