import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `StockCard`. */
function CardSkeleton() {
  return (
    <View className="gap-4 rounded-xl shadow-card bg-surface p-4">
      <View className="gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-16 rounded-pill" />
      </View>
      <View className="h-px bg-border" />
      <View className="gap-1">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-5 w-24" />
      </View>
      <View className="h-px bg-border" />
      <View className="flex-row gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <View key={index} className="flex-1 gap-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-8" />
          </View>
        ))}
      </View>
    </View>
  );
}

export function StockListSkeleton() {
  return (
    <SkeletonGroup label="Loading stock" className="gap-4 px-5 py-4">
      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}
