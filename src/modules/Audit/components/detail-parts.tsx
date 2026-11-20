import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useIsOnline } from '@/shared/hooks/use-is-online';
import { Alert, AppText, Button, Skeleton, SkeletonGroup } from '@/shared/ui';

import { errorMessage } from './error-message';

/** One card of the detail screen. The screen spaces the cards with `gap-4`. */
export function Section({
  title,
  children,
  trailing,
}: {
  title?: string;
  children: ReactNode;
  /** Sits at the right of the title, such as a count. */
  trailing?: ReactNode;
}) {
  return (
    <View className="gap-3 rounded-xl bg-surface p-4 border border-border">
      {title ? (
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="caption-strong" role="heading">
            {title}
          </AppText>
          {trailing}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** One label and value on a line, the value right-aligned. */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <AppText variant="label" tone="muted" className="shrink-0">
        {label}
      </AppText>
      <AppText variant="caption" className="min-w-0 flex-1 text-right">
        {value}
      </AppText>
    </View>
  );
}

export const divider = <View role="separator" className="h-px bg-border" />;

function PartSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="gap-4">
      {Array.from({ length: 2 }, (_, index) => (
        <View key={index} className="gap-3 rounded-xl bg-surface p-4 border border-border">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/**
 * Shows one part of a card (checklist, program, findings...) once it has loaded, a skeleton
 * while it loads, and a retry when it failed or is waiting for a connection. A failed refresh
 * keeps the data and says so.
 */
export function PartGate<T>({
  query,
  label,
  children,
}: {
  query: UseQueryResult<T>;
  /** Names the part for screen readers, for example "Loading findings". */
  label: string;
  children: (data: T) => ReactNode;
}) {
  const online = useIsOnline();

  if (query.data !== undefined) {
    return (
      <>
        {query.error && online ? (
          <Alert tone="warning" message="Could not refresh. Showing the last data." />
        ) : null}
        {children(query.data)}
      </>
    );
  }

  if (query.error || query.fetchStatus === 'paused') {
    return (
      <Section>
        <AppText variant="caption" tone="muted">
          {query.error ? errorMessage(query.error) : 'You are offline. Check your connection.'}
        </AppText>
        <Button variant="soft" onPress={() => void query.refetch()}>
          Try again
        </Button>
      </Section>
    );
  }

  return <PartSkeleton label={label} />;
}
