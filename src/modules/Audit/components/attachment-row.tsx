import { clsx } from 'clsx';
import { Pressable, View } from 'react-native';

import { AppText, focusRing, Icon } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils/format';

import type { AuditAttachment } from '../types';

export interface AttachmentRowProps {
  attachment: AuditAttachment;
  /** This file is being downloaded. */
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}

/** One attached file: its description, who added it and when. A tap downloads it. */
export function AttachmentRow({ attachment, busy, disabled, onPress }: AttachmentRowProps) {
  return (
    <Pressable
      role="button"
      aria-label={`Download ${attachment.file}`}
      aria-busy={busy}
      disabled={disabled}
      onPress={onPress}
      className={clsx(
        'min-h-control flex-row items-center gap-3 rounded-sm border border-border p-3 active:bg-surface-gray',
        (disabled || busy) && 'opacity-50',
        focusRing,
      )}>
      <Icon name="download" color="ink" />
      <View className="min-w-0 flex-1 gap-1">
        <AppText variant="caption-strong" numberOfLines={2}>
          {attachment.description}
        </AppText>
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {attachment.file}
        </AppText>
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {[attachment.uploaded_by_name, formatDateTime(attachment.created_at)]
            .filter(Boolean)
            .join(' · ')}
        </AppText>
      </View>
    </Pressable>
  );
}
