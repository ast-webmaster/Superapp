import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { gimmickRoutes } from '../navigation/routes';
import type { GimmickFlow, GimmickListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge } from './status';

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

export function GimmickCard({ flow, item }: { flow: GimmickFlow; item: GimmickListItem }) {
  return (
    <MorphLink href={gimmickRoutes.detail(flow, item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.do_no}`}
        className={clsx(
          'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.do_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {`${item.sender_name ?? '-'} to ${item.receiver_name ?? '-'}`}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <AppText variant="label" tone="muted">
            {`${plural(item.total_items, 'item')} · ${plural(item.total_qty, 'unit')}`}
          </AppText>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <RequesterPill name={item.requester_name ?? item.requester} />
            <AppText variant="label" tone="muted">
              {formatDate(item.do_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
