import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `ProductBorrowingCard`. */
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
        <View className="gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </View>
        <View className="items-end gap-1">
          <Skeleton className="h-6 w-28 rounded-pill" />
          <Skeleton className="h-4 w-16" />
        </View>
      </View>
    </View>
  );
}

export function ProductBorrowingListSkeleton() {
  return (
    <SkeletonGroup label="Loading borrowings" className="gap-4 px-5 py-4">
      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as the detail screen: summary, detail rows, an item. */
export function ProductBorrowingDetailSkeleton() {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <View key={index} className="flex-row justify-between gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </View>
    ));

  return (
    <SkeletonGroup label="Loading borrowing" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-20 rounded-pill" />
        </View>
        <Skeleton className="h-4 w-1/3" />
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-6 w-16" />
        {rows(5)}
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        {rows(3)}
      </View>
    </SkeletonGroup>
  );
}
