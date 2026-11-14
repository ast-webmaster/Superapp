import { View } from 'react-native';

import { AppText } from '@/shared/ui';

import { AttachmentChip } from './attachment-chip';

export interface UserBubbleProps {
  message: string;
  attachments: { name: string }[];
  /** Downloads a sent file. Left out for a message still on its way. */
  onOpenAttachment?: (index: number) => void;
}

/** What the user asked, on the right in a soft lavender bubble. */
export function UserBubble({ message, attachments, onOpenAttachment }: UserBubbleProps) {
  return (
    <View className="flex-row justify-end pl-12">
      <View className="shrink gap-2 rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm bg-primary-soft px-4 py-3">
        {attachments.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {attachments.map((file, index) => (
              <AttachmentChip
                key={`${file.name}-${index}`}
                name={file.name}
                onPress={onOpenAttachment ? () => onOpenAttachment(index) : undefined}
              />
            ))}
          </View>
        ) : null}
        {message ? <AppText selectable>{message}</AppText> : null}
      </View>
    </View>
  );
}
