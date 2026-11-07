import { View } from 'react-native';

import { AppText, Badge } from '@/shared/ui';

import type { PriceApprovalListItem } from '../types';
import { statusBadge } from './status';

export function PriceApprovalCard({ item }: { item: PriceApprovalListItem }) {
  return (
    <View className="gap-2 rounded-xl bg-surface p-4 shadow-card">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="module-title" className="min-w-0 flex-1">
          {item.pa_no}
        </AppText>
        <Badge {...statusBadge(item.status)} />
      </View>
      <AppText>{item.customer_name ?? item.customer_id ?? '-'}</AppText>
      <View className="flex-row justify-between gap-3">
        <AppText variant="caption" tone="muted" className="min-w-0 flex-1">
          {item.request_by_name ?? item.request_by}
        </AppText>
        <AppText variant="caption" tone="muted">
          {item.last_updated_tier ? `${item.last_updated_tier} · ` : ''}
          {item.pa_date}
        </AppText>
      </View>
    </View>
  );
}
