import { clsx } from 'clsx';
import { type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing, MorphLink } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { marketingActivityRoutes } from '../navigation/routes';
import type { MarketingActivityKind, MarketingActivityListItem } from '../types';
import { ApplicantPill } from './applicant-pill';
import { statusBadge } from './status';

export function MarketingActivityCard({
  item,
  kind,
}: {
  item: MarketingActivityListItem;
  kind: MarketingActivityKind;
}) {
  const holder = item.last_updated_names.join(', ');

  return (
    <MorphLink href={marketingActivityRoutes.detail(item.activity_uuid, kind) as Href}>
      <Pressable
        role="button"
        aria-label={`Open ${item.activity_no}`}

        className={clsx(
          'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="gap-1">
          <AppText variant="label" tone="muted" numberOfLines={1}>
            {item.activity_no}
          </AppText>
          <AppText variant="caption-strong" numberOfLines={2}>
            {item.activity_name}
          </AppText>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge size="sm" {...statusBadge(item.status)} />
            {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
            {item.brands.map((brand) => (
              <Badge key={brand.mkt_code} size="sm" label={brand.name} />
            ))}
          </View>
        </View>
        <View role="separator" className="h-px bg-border" />
        <View className="flex-row items-end justify-between gap-3">
          <View>
            <AppText variant="label" tone="muted">
              Estimated cost
            </AppText>
            <AppText variant="caption-strong">{formatMoney(item.estimated_total_cost)}</AppText>
            {holder ? (
              <AppText variant="label" tone="muted" numberOfLines={1}>
                {holder}
              </AppText>
            ) : null}
          </View>
          <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
            {item.sign_of_applicant_name ? (
              <ApplicantPill name={item.sign_of_applicant_name} />
            ) : null}
            <AppText variant="label" tone="muted">
              {formatDate(item.activity_date)}
            </AppText>
          </View>
        </View>
      </Pressable>
    </MorphLink>
  );
}
