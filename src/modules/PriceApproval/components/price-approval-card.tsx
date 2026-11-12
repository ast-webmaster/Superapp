import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing } from '@/shared/ui';
import { formatDate, formatMoney, sentenceCase } from '@/shared/utils/format';

import { priceApprovalRoutes } from '../navigation/routes';
import type { PriceApprovalListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge } from './status';

export function PriceApprovalCard({ item }: { item: PriceApprovalListItem }) {
  return (
    <Pressable
      role="button"
      aria-label={`Open ${item.pa_no}`}
      onPress={() => router.push(priceApprovalRoutes.detail(item.pa_uuid) as Href)}
      className={clsx(
        'gap-4 rounded-xl bg-surface p-4 border border-border active:bg-surface-gray',
        focusRing,
      )}>
      <View className="gap-1">
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {item.pa_no}
        </AppText>
        <AppText variant="caption-strong" numberOfLines={2}>
          {item.customer_name ?? item.customer_id ?? '-'}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" {...statusBadge(item.status)} />
          {item.last_updated_tier ? (
            <Badge size="sm" label={sentenceCase(item.last_updated_tier)} />
          ) : null}
        </View>
      </View>
      <View role="separator" className="h-px bg-border" />
      <View className="flex-row items-end justify-between gap-3">
        <View>
          <AppText variant="label" tone="muted">
            Grand total
          </AppText>
          <AppText variant="caption-strong">{formatMoney(item.grand_total)}</AppText>
        </View>
        <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
          <RequesterPill name={item.request_by_name ?? item.request_by} />
          <AppText variant="label" tone="muted">
            {formatDate(item.pa_date)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
