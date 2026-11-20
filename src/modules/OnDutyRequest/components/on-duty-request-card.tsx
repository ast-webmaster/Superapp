import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { onDutyRequestRoutes } from '../navigation/routes';
import type { OnDutyRequestListItem } from '../types';
import { RequesterPill } from './requester-pill';
import { statusBadge, tripTypeLabel } from './status';

export function OnDutyRequestCard({ item }: { item: OnDutyRequestListItem }) {
  const type = tripTypeLabel(item.type);

  return (
    <MorphLink href={onDutyRequestRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.on_duty_no}`}
        className={clsx(
          'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.on_duty_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.purpose ?? '-'}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
            {type ? <Badge size="sm" label={type} /> : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View>
            <AppText variant="label" tone="muted">
              {`Grand total · ${item.destinations_count} ${item.destinations_count === 1 ? 'destination' : 'destinations'}`}
            </AppText>
            <AppText variant="caption-strong">{formatMoney(item.grand_total)}</AppText>
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            <RequesterPill name={item.requester_name ?? item.requester} />
            <AppText variant="label" tone="muted">
              {formatDate(item.on_duty_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
