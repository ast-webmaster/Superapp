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

/** The dark market card: eyebrow and chip, the amount, the sparkline, the bar and two figures. */
function HeroSkeleton() {
  return (
    <View className="gap-4 rounded-2xl bg-ink p-5">
      <View className="flex-row items-center justify-between gap-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-7 w-16 rounded-pill" />
      </View>
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-2 w-full rounded-pill" />
      <View className="flex-row gap-3">
        <Skeleton className="h-14 flex-1 rounded-lg" />
        <Skeleton className="h-14 flex-1 rounded-lg" />
      </View>
    </View>
  );
}

/** Same order as the report: the total, then group cards. */
export function ReportSkeleton() {
  return (
    <SkeletonGroup label="Loading report" className="gap-4 px-5 pt-4">
      <HeroSkeleton />
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
      <HeroSkeleton />
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
      </View>
      <CardSkeleton />
    </SkeletonGroup>
  );
}
