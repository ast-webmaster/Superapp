import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';

import { stockGimmickRoutes } from '../navigation/routes';
import type { StockListItem } from '../types';
import { formatQuantity } from './format';

export function StockCard({ item }: { item: StockListItem }) {
  const name = item.product_name ?? item.product_code;

  return (
    <MorphLink href={stockGimmickRoutes.detail(item.id) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${name}, ${formatQuantity(item.qty)} in stock`}
        className={clsx(
          'flex-row items-center gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="min-w-0 flex-1 gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.product_code}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {name}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            {item.office_name ? <Badge size="sm" icon="building" label={item.office_name} /> : null}
          </View>
          {item.last_transaction_no ? (
            <AppText variant="label" tone="muted" numberOfLines={1}>
              {`Last: ${item.last_transaction_no}`}
            </AppText>
          ) : null}
        </View>
        <View className="shrink-0 items-end gap-1">
          <AppText variant="label" tone="muted">
            Qty
          </AppText>
          <AppText variant="title">{formatQuantity(item.qty)}</AppText>
        </View>
      </Pressable>
    </MorphLink>
  );
}
