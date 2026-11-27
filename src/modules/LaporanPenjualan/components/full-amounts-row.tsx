import { View } from 'react-native';

import { AppText, Icon, Toggle } from '@/shared/ui';

import { useLaporanPenjualanAmounts } from '../store/laporanPenjualanAmountStore';

/** The "Full amounts" setting, as a row of an Actions sheet's `ListGroup`. */
export function FullAmountsRow() {
  const fullAmounts = useLaporanPenjualanAmounts((state) => state.fullAmounts);
  const setFullAmounts = useLaporanPenjualanAmounts((state) => state.setFullAmounts);

  return (
    <View className="min-h-control flex-row items-center gap-3 py-3">
      <Icon name="eye" />
      <AppText variant="body-strong" className="min-w-0 flex-1">
        Full amounts
      </AppText>
      <Toggle label="Full amounts" value={fullAmounts} onValueChange={setFullAmounts} />
    </View>
  );
}
