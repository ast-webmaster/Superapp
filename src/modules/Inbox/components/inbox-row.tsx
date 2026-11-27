import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Badge,
  focusRing,
  Icon,
  Skeleton,
  SkeletonGroup,
  type IconName,
} from '@/shared/ui';
import { formatDateTime, sentenceCase } from '@/shared/utils/format';

import type { InboxItem } from '../types';

export interface InboxRowProps {
  item: InboxItem;
  /** The module's tile icon. */
  icon?: IconName;
  /** Opens the document. Without it the row is plain text. */
  onPress?: () => void;
}

/** One waiting document. Sits inside a `ListGroup`. */
export function InboxRow({ item, icon = 'bell', onPress }: InboxRowProps) {
  const title = item.title ?? 'Document no longer available';
  const description = [item.subtitle, item.created_at && formatDateTime(item.created_at)]
    .filter(Boolean)
    .join(' · ');

  const content = (
    <>
      <View className="size-touch items-center justify-center rounded-md bg-primary-soft">
        <Icon name={icon} color="primary" />
      </View>
      <View className="min-w-0 flex-1">
        <AppText variant="body-strong" numberOfLines={1}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Badge
        size="sm"
        tone={item.status === 'AWAITING' ? 'warning' : 'info'}
        label={sentenceCase(item.status)}
      />
    </>
  );

  const style = 'min-h-control flex-row items-center gap-3 py-3';

  if (!onPress) return <View className={style}>{content}</View>;

  return (
    <Pressable
      role="button"
      onPress={onPress}
      className={clsx(style, 'rounded-md active:bg-surface-gray', focusRing)}>
      {content}
    </Pressable>
  );
}

/** Placeholder rows for the first load, shaped like `InboxRow` inside a card. */
export function InboxRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonGroup label="Loading inbox" className="rounded-xl bg-surface px-4 shadow-card">
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} className="min-h-control flex-row items-center gap-3 py-3">
          <Skeleton className="size-touch rounded-md" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
