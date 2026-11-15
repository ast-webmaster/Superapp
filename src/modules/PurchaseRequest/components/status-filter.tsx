import { ChipGroup } from '@/shared/ui';

import type { PurchaseRequestFilter } from '../types';
import { statusLabels } from './status';

const OPTIONS = [
  { value: 'AWAITING', label: statusLabels.AWAITING },
  { value: 'all', label: 'All' },
];

type StatusFilterProps = {
  value: PurchaseRequestFilter;
  onChange: (value: PurchaseRequestFilter) => void;
};

/** Status chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <ChipGroup
      label="Filter by status"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as PurchaseRequestFilter)}
      className="flex-nowrap"
    />
  );
}
