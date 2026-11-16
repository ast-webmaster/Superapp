import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import type { StockAllItem, StockItem, StockSalesItem } from '../types';
import { formatHqStock, formatQuantity } from './format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/3 gap-1 pb-3">
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="caption-strong">{value}</AppText>
    </View>
  );
}

function Heading({ item }: { item: StockItem }) {
  return (
    <View className="gap-1">
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {item.product_code}
      </AppText>
      <AppText variant="caption-strong" numberOfLines={2}>
        {item.product_name}
      </AppText>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge size="sm" label={item.category_code} />
        {item.kind === 'sales' && item.on_order_soon ? (
          <Badge size="sm" tone="info" icon="truck" label="On order" />
        ) : null}
      </View>
    </View>
  );
}

function SalesBody({ item }: { item: StockSalesItem }) {
  return (
    <>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          Price
        </AppText>
        <AppText variant="caption-strong">
          {item.price === null ? '-' : formatMoney(item.price)}
        </AppText>
      </View>
      <View role="separator" className="h-px bg-border" />
      <View className="flex-row flex-wrap">
        <Stat label="HQ" value={formatHqStock(item)} />
        <Stat label="Your office" value={formatQuantity(item.stock_office)} />
        <Stat label="In transit" value={formatQuantity(item.stock_in_transit)} />
        {/* The server fills this only for holders of the Dusit permission. */}
        {item.stock_dusit !== null ? (
          <Stat label="Dusit" value={formatQuantity(item.stock_dusit)} />
        ) : null}
      </View>
    </>
  );
}

function AllBody({ item }: { item: StockAllItem }) {
  return (
    <>
      <View className="gap-1">
        <AppText variant="label" tone="muted">
          Total
        </AppText>
        <AppText variant="caption-strong">{formatQuantity(item.total)}</AppText>
      </View>
      <View role="separator" className="h-px bg-border" />
      <View className="flex-row flex-wrap">
        {Object.entries(item.offices).map(([office, quantity]) => (
          <Stat key={office} label={office} value={formatQuantity(quantity)} />
        ))}
      </View>
    </>
  );
}

/** One product. The server decides the shape (sales or all offices), so the card follows `kind`. */
export function StockCard({ item }: { item: StockItem }) {
  return (
    <View
      accessible
      aria-label={`${item.product_code}, ${item.product_name}`}
      className="gap-4 rounded-xl border border-border bg-surface p-4">
      <Heading item={item} />
      <View role="separator" className="h-px bg-border" />
      {item.kind === 'sales' ? <SalesBody item={item} /> : <AllBody item={item} />}
    </View>
  );
}
