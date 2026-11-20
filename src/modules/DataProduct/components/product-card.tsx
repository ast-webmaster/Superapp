import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, ProductImage } from '@/shared/ui';

import { dataProductRoutes } from '../navigation/routes';
import type { ProductListItem } from '../types';

export function ProductCard({ item }: { item: ProductListItem }) {
  return (
    <Pressable
      role="button"
      aria-label={`Open ${item.product_name}`}
      onPress={() => router.push(dataProductRoutes.detail(item.id) as Href)}
      className={clsx(
        'flex-row items-center gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
        focusRing,
      )}>
      <ProductImage uri={item.image_url} className="size-16 shrink-0" />
      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {item.product_code}
        </AppText>
        <AppText variant="caption-strong" numberOfLines={2}>
          {item.product_name}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" label={item.category_name ?? item.category_code} />
        </View>
      </View>
    </Pressable>
  );
}
