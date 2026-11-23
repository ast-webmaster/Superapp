import { ChipGroup } from '@/shared/ui';

import { IN_PROGRESS_STATUSES } from './status';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: IN_PROGRESS_STATUSES, label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

/** The status values the toolbar chips cover; any other value is set from the filter sheet. */
export const quickStatuses: readonly string[] = OPTIONS.map(({ value }) => value);

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
