import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate, formatMoney, sentenceCase } from '@/shared/utils/format';

import { priceApprovalRoutes } from '../navigation/routes';
import type { PriceApprovalListItem } from '../types';
import { ShareButton } from './share-button';
import { statusBadge } from './status';

interface MetaProps {
  title: string;
  value: string;
  align?: 'start' | 'end';
}

function Meta({ title, value, align = 'start' }: MetaProps) {
  return (
    <View className={clsx('min-w-0 flex-1', align === 'end' && 'items-end')}>
      <AppText variant="micro" tone="muted">
        {title}
      </AppText>
      <AppText variant="micro" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

export function PriceApprovalCard({ item }: { item: PriceApprovalListItem }) {
  return (
    // The share button sits beside the link, not inside it, so pressing it never opens the request.
    <View>
      <MorphLink href={priceApprovalRoutes.detail(item.pa_uuid) as Href}>
        <Pressable
          role="button"
          aria-label={`Open ${item.pa_no}`}
          className={clsx(
            'gap-4 rounded-xl bg-surface p-4 shadow-card active:bg-surface-gray',
            focusRing,
          )}>
          <View className="gap-1 pr-10">
            <AppText variant="label" tone="muted" numberOfLines={1}>
              {item.pa_no}
            </AppText>
            <AppText variant="caption-strong" numberOfLines={2}>
              {item.customer_name ?? item.customer_id ?? '-'}
            </AppText>
          </View>
          <View className="flex-row gap-3">
            <Meta title="Created by" value={item.request_by_name ?? item.request_by} />
            <Meta title="Created at" value={formatDate(item.pa_date)} align="end" />
          </View>
          <View role="separator" className="h-px bg-border" />
          <View className="flex-row items-end justify-between gap-3">
            <View className="min-w-0 shrink gap-1">
              <Badge size="xs" {...statusBadge(item.status)} />
              {item.last_updated_tier ? (
                <AppText variant="micro" tone="muted" numberOfLines={1}>
                  {sentenceCase(item.last_updated_tier)}
                </AppText>
              ) : null}
            </View>
            <View className="items-end">
              <AppText variant="label" tone="muted">
                Grand total
              </AppText>
              <AppText variant="caption-strong">{formatMoney(item.grand_total)}</AppText>
            </View>
          </View>
        </Pressable>
      </MorphLink>
      <ShareButton
        uuid={item.pa_uuid}
        paNo={item.pa_no}
        customerName={item.customer_name}
        className="absolute right-2 top-2"
      />
    </View>
  );
}
