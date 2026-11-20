import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `StockCard`. */
function CardSkeleton() {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-24 rounded-pill" />
      </View>
      <Skeleton className="h-8 w-12" />
    </View>
  );
}

export function StockListSkeleton() {
  return (
    <SkeletonGroup label="Loading stock" className="gap-4 px-5 py-4">
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same shape as the detail screen: the summary, the stock, then the history. */
export function StockDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading stock" className="gap-4 px-5 pt-4">
      <View className="flex-row gap-4 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="size-20 rounded-lg" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-24 rounded-pill" />
        </View>
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} className="flex-row justify-between gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

/** The history card while Track Stock loads. */
export function MovementsSkeleton() {
  return (
    <SkeletonGroup
      label="Loading history"
      className="gap-4 rounded-xl border border-border bg-surface p-4">
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} className="flex-row justify-between gap-4">
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </View>
          <Skeleton className="h-6 w-12" />
        </View>
      ))}
    </SkeletonGroup>
  );
}
