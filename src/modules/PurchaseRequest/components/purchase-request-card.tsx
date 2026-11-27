import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { purchaseRequestRoutes } from '../navigation/routes';
import type { PurchaseRequestListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge } from './status';

export function PurchaseRequestCard({ item }: { item: PurchaseRequestListItem }) {
  return (
    <MorphLink href={purchaseRequestRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.pr_no}`}

        className={clsx(
          'gap-4 rounded-xl shadow-card bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.pr_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.purpose ?? '-'}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
            {item.category ? <Badge size="sm" label={item.category} /> : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View>
            <AppText variant="label" tone="muted">
              {`Grand total · ${item.items_count} ${item.items_count === 1 ? 'item' : 'items'}`}
            </AppText>
            <AppText variant="caption-strong">{formatMoney(item.grand_total)}</AppText>
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <RequesterPill name={item.requester_name ?? item.requester} />
            <AppText variant="label" tone="muted">
              {formatDate(item.pr_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
