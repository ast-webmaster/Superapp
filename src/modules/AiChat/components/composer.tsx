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
  /** Shown in place of send while there is nothing to send, such as the mic. */
  mic?: ReactNode;
  /** Voice input is on: the mic stays in place as its stop button while words fill the field. */
  listening?: boolean;
}

/** The floating message bar: attach, type, then send (or speak, while it is empty). */
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
  const canSend = hasContent && online && !busy;

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
      <View className="min-h-control flex-row items-end rounded-xl border border-border bg-surface px-1 shadow-card">
        <IconButton icon="plus" size="sm" label="Attach file" onPress={attach} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Message AI…"
          placeholderTextColor={colors['ink-muted']}
          aria-label="Message"
          multiline
          maxLength={MAX_LENGTH}
          className="max-h-32 min-h-touch flex-1 self-center px-2 py-3 font-rubik text-body text-ink outline-none"
        />
        {(hasContent && !listening) || !mic ? (
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
                <Icon name="arrow-up" size={20} color="on-primary" />
              </View>
            )}
          </Pressable>
        ) : (
          mic
        )}
      </View>
    </View>
  );
}
