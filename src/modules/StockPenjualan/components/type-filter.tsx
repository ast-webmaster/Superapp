import { ChipGroup } from '@/shared/ui';
import { sentenceCase } from '@/shared/utils/format';

import type { StockType } from '../types';

const TYPES: StockType[] = [
  'AVAILABLE',
  'ON HAND',
  'ON ORDER',
  'TRANSFER OUTSTANDING',
  'SALES OUTSTANDING',
];

const OPTIONS = TYPES.map((value) => ({ value, label: sentenceCase(value) }));

type TypeFilterProps = {
  value: StockType;
  onChange: (value: StockType) => void;
};

/** What the all-offices view counts, in one row. `ListToolbar` scrolls it beside its buttons. */
export function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <ChipGroup
      label="Filter by stock type"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as StockType)}
      className="flex-nowrap"
    />
  );
}
