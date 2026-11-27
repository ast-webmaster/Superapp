import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `RoomCard`. */
function RoomSkeleton() {
  return (
    <View className="gap-4 rounded-xl shadow-card bg-surface p-4">
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-16 rounded-pill" />
        </View>
        <Skeleton className="h-4 w-1/3" />
      </View>
      <View className="h-px bg-border" />
      <View className="gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </View>
    </View>
  );
}

export function RoomListSkeleton() {
  return (
    <SkeletonGroup label="Loading rooms" className="gap-4 px-5 py-4">
      {Array.from({ length: 3 }, (_, index) => (
        <RoomSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as the detail screen: summary, details, people. */
export function BookingDetailSkeleton() {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <View key={index} className="flex-row justify-between gap-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </View>
    ));

  return (
    <SkeletonGroup label="Loading booking" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-20 rounded-pill" />
        </View>
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
      </View>
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
        <Skeleton className="h-6 w-16" />
        {rows(4)}
      </View>
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
        <Skeleton className="h-6 w-24" />
        {rows(2)}
      </View>
    </SkeletonGroup>
  );
}
