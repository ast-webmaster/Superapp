import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { registerCustomerRoutes } from '../navigation/routes';
import type { RegisterCustomerListItem } from '../types';
import { statusBadge } from './status';

export function RegisterCustomerCard({ item }: { item: RegisterCustomerListItem }) {
  return (
    <MorphLink href={registerCustomerRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.register_customer_no}`}
        className={clsx(
          'gap-4 rounded-xl bg-surface p-4 border border-border active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.register_customer_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.customer_name}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? (
              <Badge size="sm" tone="info" icon="bell" label="Waiting for you" />
            ) : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <AppText variant="label" tone="muted">
              Category
            </AppText>
            <AppText variant="caption-strong" numberOfLines={1}>
              {`${item.category} · ${item.forms_of_business}`}
            </AppText>
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <AppText variant="label" tone="muted" numberOfLines={1}>
              {item.requester_name ?? item.requester}
            </AppText>
            <AppText variant="label" tone="muted">
              {formatDate(item.register_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
