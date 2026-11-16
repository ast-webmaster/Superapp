import { SegmentedControl } from '@/shared/ui';

import type { MarketingPromoKind } from '../types';

const OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'combination', label: 'Combination' },
] as const;

type KindSwitchProps = {
  value: MarketingPromoKind;
  onChange: (value: MarketingPromoKind) => void;
};

/** Single brand promos or Combination ones (several brands): two separate lists. */
export function KindSwitch({ value, onChange }: KindSwitchProps) {
  return (
    <SegmentedControl
      label="Promo group"
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as MarketingPromoKind)}
      fullWidth
      className="mx-5"
    />
  );
}
