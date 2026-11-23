import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { requestDesignRoutes } from '../navigation/routes';
import type { RequestDesignListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { priorityBadge, statusBadge } from './status';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function RequestDesignCard({ item }: { item: RequestDesignListItem }) {
  const brands = item.brands.map((brand) => brand.category_name).join(', ');

  return (
    <MorphLink href={requestDesignRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.request_design_no}`}
        className={clsx(
          'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.request_design_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {brands || '-'}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.priority === 'HIGH' ? (
              <Badge size="sm" {...priorityBadge(item.priority)} />
            ) : null}
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View className="gap-1">
            <AppText variant="label" tone="muted">
              {`${plural(item.total_items, 'item')} · ${plural(item.total_qty, 'piece')}`}
            </AppText>
            <AppText variant="label" tone="muted">
              {`Due ${formatDate(item.due_date)}`}
            </AppText>
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <RequesterPill name={item.requester_name ?? item.requester} />
            {item.picked_by_name ? (
              <AppText variant="label" tone="muted" numberOfLines={1}>
                {`Designer ${item.picked_by_name}`}
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
