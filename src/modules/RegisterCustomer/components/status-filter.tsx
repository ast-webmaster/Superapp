import { ChipGroup } from '@/shared/ui';

import { STATUS_OPTIONS } from './status';

type StatusFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

// The two chips worth a tap on the toolbar; the rest of the statuses are in the filter sheet.
const OPTIONS = STATUS_OPTIONS.slice(0, 2);

/** Status chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <ChipGroup
      label="Filter by status"
      options={OPTIONS}
      value={value}
      onChange={onChange}
      className="flex-nowrap"
    />
  );
}
