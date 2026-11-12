import { ChipGroup } from '@/shared/ui';

import type { PriceApprovalFilter } from '../types';
import { statusLabels } from './status';

const OPTIONS = [
  { value: 'AWAITING', label: statusLabels.AWAITING },
  { value: 'all', label: 'All' },
];

type StatusFilterProps = {
  value: PriceApprovalFilter;
  onChange: (value: PriceApprovalFilter) => void;
};

/** Status chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <ChipGroup
      label="Filter by status"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as PriceApprovalFilter)}
      className="flex-nowrap"
    />
  );
}
