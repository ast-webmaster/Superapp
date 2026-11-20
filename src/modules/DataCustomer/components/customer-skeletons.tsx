import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `CustomerCard`. */
function CardSkeleton() {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-pill" />
      </View>
      <View className="gap-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </View>
      <View role="separator" className="h-px bg-border" />
      <View className="flex-row gap-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </View>
    </View>
  );
}

export function CustomerListSkeleton() {
  return (
    <SkeletonGroup label="Loading customers" className="gap-4 px-5 py-4">
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same shape as the detail screen: a summary card, then detail cards. */
export function CustomerDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading customer" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-20 rounded-pill" />
      </View>
      {Array.from({ length: 2 }, (_, card) => (
        <View key={card} className="gap-3 rounded-xl border border-border bg-surface p-4">
          {Array.from({ length: 4 }, (_, row) => (
            <View key={row} className="flex-row justify-between gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </View>
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}
