import { ChipGroup } from '@/shared/ui';

import { AWAITING_STATUSES, statusLabels } from './status';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: AWAITING_STATUSES, label: 'Awaiting' },
  { value: 'BORROWED', label: statusLabels.BORROWED },
];

/** The status values the toolbar chips cover; any other value is set from the filter sheet. */
export const QUICK_STATUSES: readonly string[] = OPTIONS.map(({ value }) => value);

type StatusFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

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
