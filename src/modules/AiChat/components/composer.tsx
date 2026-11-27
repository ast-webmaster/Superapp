import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppError } from '@/core/errors';
import { pickFile, type PickedFile } from '@/core/files';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { colors } from '@/shared/theme/tokens';
import { AppText, Icon, IconButton, focusRing, useToast } from '@/shared/ui';

import { checkAttachment } from '../utils/attachment-rules';
import { AttachmentChip } from './attachment-chip';

/** The server's limit on one message. */
const MAX_LENGTH = 2000;

export interface ComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  files: PickedFile[];
  onChangeFiles: (files: PickedFile[]) => void;
  onSend: () => void;
  /** A message is on its way: the user may type the next one but not send it yet. */
  busy: boolean;
  /** Voice input button, next to attach. */
  mic?: ReactNode;
  /** Voice input is on: words fill the field, so send waits until the user stops. */
  listening?: boolean;
}

/** The floating message card: the field on top; attach and voice on the left, send on the right. */
export function Composer({
  value,
  onChangeText,
  files,
  onChangeFiles,
  onSend,
  busy,
  mic,
  listening = false,
}: ComposerProps) {
  const toast = useToast();
  const online = useIsOnline();
  const hasContent = value.trim().length > 0 || files.length > 0;
  const canSend = hasContent && online && !busy && !listening;

  const attach = async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      const problem = checkAttachment(file, files);
      if (problem) {
        toast.show({ tone: 'danger', message: problem });
        return;
      }
      onChangeFiles([...files, file]);
    } catch (error) {
      toast.show({
        tone: 'danger',
        message: error instanceof AppError ? error.message : 'Could not open the file. Try again.',
      });
    }
  };

  return (
    <View className="gap-2">
      {!online ? (
        <AppText variant="caption" tone="muted" className="px-2">
          You are offline. Connect to send a message.
        </AppText>
      ) : null}
      {files.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {files.map((file, index) => (
            <AttachmentChip
              key={`${file.uri}-${index}`}
              name={file.name}
              onRemove={() => onChangeFiles(files.filter((_, i) => i !== index))}
            />
          ))}
        </View>
      ) : null}
      <View className="rounded-xl shadow-card bg-surface pl-4 pr-1 pt-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask Lumina anything…"
          placeholderTextColor={colors['ink-muted']}
          aria-label="Message"
          multiline
          maxLength={MAX_LENGTH}
          textAlignVertical="top"
          className="max-h-32 min-h-14 pr-3 font-sora text-body text-ink outline-none"
        />
        <View className="flex-row items-center justify-between">
          <View className="flex-row">
            <IconButton icon="plus" size="sm" tone="gray" label="Attach file" onPress={attach} />
            {mic}
          </View>
          <Pressable
            role="button"
            aria-label="Send"
            aria-disabled={!canSend}
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={onSend}
            className={clsx('size-touch items-center justify-center rounded-pill', focusRing)}>
            {/* Pressed fill from the Pressable's state: an `active:` class on this View would make
                NativeWind turn it into a second pressable that takes the tap from onSend. */}
            {({ pressed }) => (
              <View
                className={clsx(
                  'size-10 items-center justify-center rounded-pill',
                  pressed ? 'bg-primary-pressed' : 'bg-primary',
                  !canSend && 'opacity-50',
                )}>
                <Icon name="send" size={20} color="on-primary" />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
