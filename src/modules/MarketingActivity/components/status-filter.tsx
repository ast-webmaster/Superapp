import { MultiChipGroup } from '@/shared/ui';

import type { MarketingActivityStatus } from '../types';
import { statusLabels } from './status';

const OPTIONS = [{ value: 'AWAITING', label: statusLabels.AWAITING }];

type StatusFilterProps = {
  value: MarketingActivityStatus[];
  onChange: (value: MarketingActivityStatus[]) => void;
};

/** Status chips in one row. `ListToolbar` scrolls them beside its buttons. */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <MultiChipGroup
      label="Filter by status"
      options={OPTIONS}
      values={value}
      allLabel="All"
      onChange={(next) => onChange(next as MarketingActivityStatus[])}
      className="flex-nowrap"
    />
  );
}
