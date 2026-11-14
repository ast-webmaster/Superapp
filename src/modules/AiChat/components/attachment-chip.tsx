import { Pressable, View } from 'react-native';

import { AppText, Icon, IconButton, focusRing } from '@/shared/ui';

export interface AttachmentChipProps {
  name: string;
  /** Downloads the file. */
  onPress?: () => void;
  /** Takes the file off a message that is not sent yet. */
  onRemove?: () => void;
}

/** A file on a message: in the composer before sending, or on a sent message. */
export function AttachmentChip({ name, onPress, onRemove }: AttachmentChipProps) {
  const body = (
    <View className="flex-row items-center gap-2 rounded-pill border border-border bg-surface py-2 pl-3 pr-4">
      <Icon name="doc" size={16} color="ink-muted" />
      <AppText variant="caption" numberOfLines={1} className="shrink">
        {name}
      </AppText>
    </View>
  );

  return (
    <View className="max-w-full flex-row items-center">
      {onPress ? (
        <Pressable
          role="button"
          aria-label={`Download ${name}`}
          onPress={onPress}
          hitSlop={8}
          className={`shrink active:opacity-70 ${focusRing}`}>
          {body}
        </Pressable>
      ) : (
        <View className="shrink">{body}</View>
      )}
      {onRemove ? (
        <IconButton icon="x" size="xs" label={`Remove ${name}`} onPress={onRemove} />
      ) : null}
    </View>
  );
}
