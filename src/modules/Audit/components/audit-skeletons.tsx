import { View } from 'react-native';

import { Skeleton, SkeletonGroup } from '@/shared/ui';

/** Same shape as `AuditCard`. */
function CardSkeleton() {
  return (
    <View className="gap-4 rounded-xl bg-surface p-4 border border-border">
      <View className="gap-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2 rounded-pill" />
      </View>
      <View className="h-px bg-border" />
      <View className="gap-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </View>
    </View>
  );
}

export function AuditListSkeleton() {
  return (
    <SkeletonGroup label="Loading audits" className="gap-4 px-5 py-4">
      {Array.from({ length: 5 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </SkeletonGroup>
  );
}

/** Same order as the detail screen: summary card, view switch, then a part. */
export function AuditDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading audit" className="gap-4 px-5 pt-4">
      <View className="gap-3 rounded-xl bg-surface p-4 border border-border">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2 rounded-pill" />
        <Skeleton className="h-4 w-2/3" />
      </View>
      <Skeleton className="h-12 w-full rounded-pill" />
      <View className="gap-3 rounded-xl bg-surface p-4 border border-border">
        <Skeleton className="h-5 w-16" />
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} className="flex-row justify-between gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}
