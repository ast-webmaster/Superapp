import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

function CardSkeleton() {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row justify-between gap-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-6 w-20 rounded-pill" />
      </View>
      <Skeleton className="h-2 w-full rounded-pill" />
      <View className="flex-row items-end justify-between">
        <View className="gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32" />
        </View>
        <Skeleton className="h-6 w-12" />
      </View>
    </View>
  );
}

/** Same order as the report: the total, then group cards. */
export function ReportSkeleton() {
  return (
    <SkeletonGroup label="Loading report" className="gap-4 px-5 pt-4">
      <View className="flex-row items-center gap-4 rounded-xl border border-border bg-surface p-4">
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </View>
        <Skeleton className="size-24 rounded-pill" />
      </View>
      {Array.from({ length: 3 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as a group: the summary, the daily chart, then branch cards. */
export function GroupSkeleton() {
  return (
    <SkeletonGroup label="Loading group" className="gap-4 px-5 pt-4">
      <CardSkeleton />
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
      </View>
      <CardSkeleton />
    </SkeletonGroup>
  );
}
