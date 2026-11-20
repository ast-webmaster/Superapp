import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, focusRing, Icon, MorphLink, ProductImage } from '@/shared/ui';

import { dataProductRoutes } from '../navigation/routes';
import type { ProductListItem } from '../types';

/** One product: the picture and the name lead, the category and codes sit quietly around them. */
export function ProductCard({ item }: { item: ProductListItem }) {
  const codes = [item.product_code, item.sku_no].filter(Boolean).join(' · ');

  return (
    <MorphLink href={dataProductRoutes.detail(item.id) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.product_name}`}
        className={clsx(
          'flex-row items-center gap-4 rounded-xl border border-border bg-surface p-3 active:bg-surface-gray',
          focusRing,
        )}>
        <ProductImage uri={item.image_url} className="size-20 shrink-0" />
        <View className="min-w-0 flex-1 gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.category_name ?? item.category_code}
          </AppText>
          <AppText variant="module-title" numberOfLines={2}>
            {item.product_name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {codes}
          </AppText>
        </View>
        <Icon name="chevron-right" size={20} color="ink-muted" />
      </Pressable>
    </MorphLink>
  );
}
