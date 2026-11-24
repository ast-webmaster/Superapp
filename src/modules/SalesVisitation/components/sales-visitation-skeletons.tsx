import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `SalesVisitationCard`. */
function CardSkeleton() {
  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2 rounded-pill" />
      </View>
      <View className="h-px bg-border" />
      <View className="flex-row items-end justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-28 rounded-pill" />
      </View>
    </View>
  );
}

export function SalesVisitationListSkeleton() {
  return (
    <SkeletonGroup label="Loading visits" className="gap-4 px-5 py-4">
      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as the detail screen: summary, plan, check-in. */
export function SalesVisitationDetailSkeleton() {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <View key={index} className="flex-row justify-between gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </View>
    ));

  return (
    <SkeletonGroup label="Loading visit" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-28 rounded-pill" />
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-5 w-1/4" />
        {rows(4)}
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-16 w-full" />
      </View>
    </SkeletonGroup>
  );
}
