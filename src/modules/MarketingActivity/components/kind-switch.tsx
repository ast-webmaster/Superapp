import { SegmentedControl } from '@/shared/ui';

import type { MarketingActivityKind } from '../types';

const OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'combination', label: 'Combination' },
] as const;

type KindSwitchProps = {
  value: MarketingActivityKind;
  onChange: (value: MarketingActivityKind) => void;
};

/** Single brand activities or Combination ones (several brands): two separate lists. */
export function KindSwitch({ value, onChange }: KindSwitchProps) {
  return (
    <SegmentedControl
      label="Activity group"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as MarketingActivityKind)}
      fullWidth
      className="mx-5"
    />
  );
}
