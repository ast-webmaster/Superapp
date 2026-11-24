import { ChipGroup } from '@/shared/ui';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'CHECK-IN', label: 'On site' },
  { value: 'COMPLETED', label: 'Completed' },
];

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
