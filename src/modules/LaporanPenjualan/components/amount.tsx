import type { TextStyle } from 'react-native';

import { AppText, type AppTextProps } from '@/shared/ui';
import { formatCompactMoney, formatMoney } from '@/shared/utils/format';

import { useLaporanPenjualanAmounts } from '../store/laporanPenjualanAmountStore';

/** Equal-width digits, so amounts in a column line up and do not jitter when they change. */
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export interface AmountProps extends Omit<AppTextProps, 'children'> {
  value: number;
  /** A word before the amount, such as "Target". */
  prefix?: string;
}

/**
 * A rupiah amount in tabular figures: short ("Rp 1.3 Mil") until the user asks for full amounts.
 * Screen readers always get the full one.
 */
export function Amount({ value, prefix, style, ...props }: AmountProps) {
  const full = useLaporanPenjualanAmounts((state) => state.fullAmounts);
  const lead = prefix ? `${prefix} ` : '';

  return (
    <AppText {...props} aria-label={`${lead}${formatMoney(value)}`} style={[tabular, style]}>
      {`${lead}${(full ? formatMoney : formatCompactMoney)(value)}`}
    </AppText>
  );
}
