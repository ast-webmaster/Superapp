import type { UseQueryResult } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { sizes } from '@/shared/theme/tokens';
import { Alert, Button, EmptyState, Loading, Skeleton, SkeletonGroup } from '@/shared/ui';
import { formatSyncedAt } from '@/shared/utils/format';

function CardSkeleton() {
  return (
    <View className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row justify-between gap-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-6 w-20 rounded-pill" />
      </View>
      <Skeleton className="h-2 w-full rounded-pill" />
      <View className="flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </View>
    </View>
  );
}

export interface QueryViewProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
}

/**
 * The analytics data states: skeleton on the first load, an error, no-access or offline screen
 * with retry, and over loaded data the notices (offline, failed refresh, loading another month)
 * and pull to refresh. The content is the render prop.
 */
export function QueryView<T>({ query, children }: QueryViewProps<T>) {
  const { bottom } = useSafeAreaInsets();
  const online = useIsOnline();
  const [pulling, setPulling] = useState(false);
  const { data, error, fetchStatus, dataUpdatedAt, isPlaceholderData, refetch } = query;

  const retry = (
    <Button variant="soft" onPress={() => refetch()}>
      Try again
    </Button>
  );

  if (data === undefined) {
    if (error) {
      const { code, message } = toAppError(error);
      return code === 'forbidden' ? (
        <EmptyState
          icon="lock"
          title="No access to analytics"
          description="Your account cannot read designer analytics. Ask an admin if you think this is wrong."
        />
      ) : (
        <EmptyState icon="alert" title="Could not load analytics" description={message}>
          {retry}
        </EmptyState>
      );
    }
    if (fetchStatus === 'paused') {
      return (
        <EmptyState
          icon="alert"
          title="You are offline"
          description="Check your connection and try again.">
          {retry}
        </EmptyState>
      );
    }
    return (
      <SkeletonGroup label="Loading analytics" className="gap-4 px-5 pt-4">
        {Array.from({ length: 3 }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </SkeletonGroup>
    );
  }

  const pull = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  return (
    <ScrollView
      contentContainerClassName="gap-4 px-5 pt-4"
      contentContainerStyle={{ paddingBottom: bottom + sizes.screenTopGap, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={pulling} onRefresh={pull} />}>
      {isPlaceholderData ? (
        <Loading label="Loading this month" />
      ) : !online ? (
        <Alert
          tone="warning"
          message={`You are offline. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
        />
      ) : error ? (
        <Alert
          tone="warning"
          message={`Could not refresh. Showing data from ${formatSyncedAt(dataUpdatedAt)}.`}
        />
      ) : null}
      {children(data)}
    </ScrollView>
  );
}
