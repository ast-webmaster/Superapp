import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, Icon, MorphLink } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { salesVisitationRoutes } from '../navigation/routes';
import type { SalesVisitationListItem } from '../types';
import { statusBadge } from './status';

export function SalesVisitationCard({ item }: { item: SalesVisitationListItem }) {
  const purposes = item.purposes.map((purpose) => purpose.name).join(', ');

  return (
    <MorphLink href={salesVisitationRoutes.detail(item.uuid) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.title}`}
        className={clsx(
          'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.customer_name ?? '-'}
            {item.customer_registered ? '' : ' · Not registered'}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.title}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.has_flags ? (
              <Badge size="sm" tone="warning" icon="alert" label="GPS notes" />
            ) : null}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <View className="flex-row items-center gap-1">
              <Icon name="calendar" size={12} color="ink-muted" />
              <AppText variant="label" tone="muted">
                {formatDate(item.visitation_date)}
              </AppText>
            </View>
            {purposes ? (
              <AppText variant="label" tone="muted" numberOfLines={1}>
                {purposes}
              </AppText>
            ) : null}
          </View>
          {item.created_by_name ? (
            <View className="min-h-6 max-w-1/2 shrink flex-row items-center gap-1 rounded-lg bg-surface-gray px-2">
              <Icon name="user" size={12} />
              <AppText variant="label" numberOfLines={1} className="shrink">
                {item.created_by_name}
              </AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </MorphLink>
  );
}
