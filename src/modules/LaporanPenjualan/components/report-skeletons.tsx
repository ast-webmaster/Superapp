import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** A row of two ticker tiles. */
function TileRowSkeleton({ className }: { className: string }) {
  return (
    <View className="flex-row gap-3">
      <Skeleton className={`flex-1 rounded-xl ${className}`} />
      <Skeleton className={`flex-1 rounded-xl ${className}`} />
    </View>
  );
}

/** The headline card: title, amount, chip, the bars and two figures. */
function HeroSkeleton() {
  return (
    <View className="items-center gap-4 rounded-2xl shadow-card bg-surface p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-7 w-1/3 rounded-pill" />
      <Skeleton className="h-40 w-full" />
      <View className="flex-row gap-3">
        <Skeleton className="h-14 flex-1 rounded-md" />
        <Skeleton className="h-14 flex-1 rounded-md" />
      </View>
    </View>
  );
}

/** Same order as the report: the total, then group tiles two to a row. */
export function ReportSkeleton() {
  return (
    <SkeletonGroup label="Loading report" className="gap-4 px-5 pt-4">
      <HeroSkeleton />
      <TileRowSkeleton className="h-40" />
      <TileRowSkeleton className="h-40" />
    </SkeletonGroup>
  );
}

/** Same order as a group: the summary, the daily chart, then branch tiles. */
export function GroupSkeleton() {
  return (
    <SkeletonGroup label="Loading group" className="gap-4 px-5 pt-4">
      <HeroSkeleton />
      <View className="gap-3 rounded-xl shadow-card bg-surface p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-40 w-full" />
      </View>
      <TileRowSkeleton className="h-28" />
    </SkeletonGroup>
  );
}
