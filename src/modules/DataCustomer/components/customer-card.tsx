import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing } from '@/shared/ui';

import { dataCustomerRoutes } from '../navigation/routes';
import type { CustomerListItem } from '../types';

export function CustomerCard({ item }: { item: CustomerListItem }) {
  const meta = [item.office_name, item.pic_name].filter(Boolean).join(' · ');

  return (
    <Pressable
      role="button"
      aria-label={`Open ${item.customer_name}`}
      onPress={() => router.push(dataCustomerRoutes.detail(item.id) as Href)}
      className={clsx(
        'gap-2 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
        focusRing,
      )}>
      <AppText variant="label" tone="muted" numberOfLines={1}>
        {item.customer_id}
      </AppText>
      <AppText variant="caption-strong" numberOfLines={2}>
        {item.customer_name}
      </AppText>
      {item.category || item.taxation_status ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {item.category ? <Badge size="sm" label={item.category} /> : null}
          {item.taxation_status ? (
            <Badge size="sm" tone="neutral" label={item.taxation_status} />
          ) : null}
        </View>
      ) : null}
      {meta ? (
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {meta}
        </AppText>
      ) : null}
    </Pressable>
  );
}
