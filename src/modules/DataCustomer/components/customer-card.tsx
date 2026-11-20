import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';

import { dataCustomerRoutes } from '../navigation/routes';
import type { CustomerListItem } from '../types';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 gap-1">
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="caption-strong" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

/** One customer: the name leads, the code and tax status frame it, office and PIC close it. */
export function CustomerCard({ item }: { item: CustomerListItem }) {
  const code = [item.customer_id, item.category].filter(Boolean).join(' · ');
  const hasFacts = Boolean(item.office_name || item.pic_name);

  return (
    <MorphLink href={dataCustomerRoutes.detail(item.id) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.customer_name}`}
        className={clsx(
          'gap-3 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="label" tone="muted" numberOfLines={1} className="shrink">
            {code}
          </AppText>
          {item.taxation_status ? (
            <Badge size="sm" tone="neutral" label={item.taxation_status} />
          ) : null}
        </View>
        <View className="gap-1">
          <AppText variant="module-title" numberOfLines={2}>
            {item.customer_name}
          </AppText>
          {item.customer_address ? (
            <AppText variant="caption" tone="muted" numberOfLines={2}>
              {item.customer_address}
            </AppText>
          ) : null}
        </View>
        {hasFacts ? (
          <>
            <View role="separator" className="h-px bg-border" />
            <View className="flex-row gap-4">
              {item.office_name ? <Fact label="Office" value={item.office_name} /> : null}
              {item.pic_name ? <Fact label="PIC" value={item.pic_name} /> : null}
            </View>
          </>
        ) : null}
      </Pressable>
    </MorphLink>
  );
}
