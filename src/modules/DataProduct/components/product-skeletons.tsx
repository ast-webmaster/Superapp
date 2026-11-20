import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `ProductCard`. */
function CardSkeleton() {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-border bg-surface p-3">
      <Skeleton className="size-20 rounded-lg" />
      <View className="flex-1 gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </View>
    </View>
  );
}

export function ProductListSkeleton() {
  return (
    <SkeletonGroup label="Loading products" className="gap-4 px-5 py-4">
      {Array.from({ length: 6 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same shape as the detail screen: pictures, then three cards. */
export function ProductDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading product" className="gap-4 px-5 pt-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-20 rounded-pill" />
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
