import type { TextStyle } from 'react-native';

import { AppText, type AppTextProps } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

/** Equal-width digits, so amounts in a column line up and do not jitter when they change. */
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export interface AmountProps extends Omit<AppTextProps, 'children'> {
  value: number;
}

/** A rupiah amount in the full `formatMoney` form, set in tabular figures. */
export function Amount({ value, style, ...props }: AmountProps) {
  return (
    <AppText {...props} style={[tabular, style]}>
      {formatMoney(value)}
    </AppText>
  );
}
