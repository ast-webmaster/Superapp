import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { productBorrowingRoutes } from '../navigation/routes';
import type { ProductBorrowingListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge } from './status';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function ProductBorrowingCard({ item }: { item: ProductBorrowingListItem }) {
  return (
    <MorphLink href={productBorrowingRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.product_borrowing_no}`}
        className={clsx(
          'gap-4 rounded-xl shadow-card bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.product_borrowing_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.customer_name ?? '-'}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View>
            <AppText variant="label" tone="muted">
              {`${plural(item.total_items, 'item')} · ${plural(item.total_qty, 'unit')}`}
            </AppText>
            {item.last_updated_names.length > 0 ? (
              <AppText variant="caption" numberOfLines={1}>
                {`${item.last_updated_tier ?? 'With'}: ${item.last_updated_names.join(', ')}`}
              </AppText>
            ) : null}
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <RequesterPill name={item.requester_name ?? item.requester} />
            <AppText variant="label" tone="muted">
              {formatDate(item.product_borrowing_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
