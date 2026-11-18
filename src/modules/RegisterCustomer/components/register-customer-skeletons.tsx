import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `RegisterCustomerCard`. */
function CardSkeleton() {
  return (
    <View className="gap-4 rounded-xl bg-surface p-4 border border-border">
      <View className="gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2 rounded-pill" />
      </View>
      <View className="h-px bg-border" />
      <View className="flex-row items-end justify-between gap-3">
        <View className="gap-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-32" />
        </View>
        <View className="items-end gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </View>
      </View>
    </View>
  );
}

export function RegisterCustomerListSkeleton() {
  return (
    <SkeletonGroup label="Loading registrations" className="gap-4 px-5 py-4">
      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as the detail screen: summary, then the detail cards. */
export function RegisterCustomerDetailSkeleton() {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <View key={index} className="flex-row justify-between gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </View>
    ));

  return (
    <SkeletonGroup label="Loading registration" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl bg-surface p-4 border border-border">
        <View className="flex-row items-center justify-between gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-24 rounded-pill" />
        </View>
        <Skeleton className="h-4 w-1/3" />
      </View>
      {[5, 4].map((count) => (
        <View key={count} className="gap-3 rounded-xl bg-surface p-4 border border-border">
          <Skeleton className="h-6 w-20" />
          {rows(count)}
        </View>
      ))}
    </SkeletonGroup>
  );
}
