import { clsx } from 'clsx';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText, Badge, focusRing } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import { marketingPromoRoutes } from '../navigation/routes';
import type { MarketingPromoKind, MarketingPromoListItem } from '../types';
import { ApplicantPill } from './applicant-pill';
import { recapBadge, statusBadge } from './status';

export function MarketingPromoCard({
  item,
  kind,
}: {
  item: MarketingPromoListItem;
  kind: MarketingPromoKind;
}) {
  const holder = item.last_updated_names.join(', ');

  return (
    <Pressable
      role="button"
      aria-label={`Open ${item.promo_no}`}
      onPress={() => router.push(marketingPromoRoutes.detail(item.uuid, kind) as Href)}
      className={clsx(
        'gap-4 rounded-xl border border-border bg-surface p-4 active:bg-surface-gray',
        focusRing,
      )}>
      <View className="gap-1">
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {item.promo_no}
        </AppText>
        <AppText variant="caption-strong" numberOfLines={2}>
          {item.promo_name}
        </AppText>
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge size="sm" {...statusBadge(item.status)} />
          {item.recap_status ? <Badge size="sm" {...recapBadge(item.recap_status)} /> : null}
          {item.awaiting_me ? <Badge size="sm" tone="info" label="Waiting for you" /> : null}
          {item.brands.map((brand, index) => (
            <Badge
              key={brand.mkt_code ?? index}
              size="sm"
              label={brand.name ?? brand.mkt_code ?? '-'}
            />
          ))}
        </View>
      </View>
      <View role="separator" className="h-px bg-border" />
      <View className="flex-row items-end justify-between gap-3">
        <View>
          <AppText variant="label" tone="muted">
            Estimated cost
          </AppText>
          <AppText variant="caption-strong">
            {item.estimated_total_cost === null ? '-' : formatMoney(item.estimated_total_cost)}
          </AppText>
          {holder ? (
            <AppText variant="label" tone="muted" numberOfLines={1}>
              {holder}
            </AppText>
          ) : null}
        </View>
        <View className="min-w-0 max-w-1/2 shrink items-end gap-1">
          {item.requester_name ? <ApplicantPill name={item.requester_name} /> : null}
          {item.promo_date ? (
            <AppText variant="label" tone="muted">
              {formatDate(item.promo_date)}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
