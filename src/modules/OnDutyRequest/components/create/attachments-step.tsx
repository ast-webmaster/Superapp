import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile } from '@/core/files';
import { Alert, AppText, Button, Icon, IconButton, TextField } from '@/shared/ui';

import { localId, MAX_FILE_BYTES, MAX_ATTACHMENTS, type Errors } from '../../create/draft';
import type { DraftAttachment } from '../../types';
import { formatFileSize } from './file-size';

export interface AttachmentsStepProps {
  attachments: DraftAttachment[];
  errors: Errors;
  onChange: (attachments: DraftAttachment[]) => void;
  /** A resubmit replaces the files of the request, so the old ones must be added again. */
  replacesOld?: boolean;
}

export function AttachmentsStep({
  attachments,
  errors,
  onChange,
  replacesOld = false,
}: AttachmentsStepProps) {
  const [pickError, setPickError] = useState<string>();

  const add = async () => {
    setPickError(undefined);
    try {
      const file = await pickFile();
      if (!file) return;
      if (file.size !== null && file.size > MAX_FILE_BYTES) {
        setPickError('That file is larger than 10 MB. Choose a smaller one.');
        return;
      }
      onChange([...attachments, { id: localId(), description: '', file }]);
    } catch (error) {
      setPickError(toAppError(error).message);
    }
  };

  const update = (id: string, description: string) =>
    onChange(attachments.map((item) => (item.id === id ? { ...item, description } : item)));

  return (
    <>
      <AppText tone="muted">
        {`Optional. Up to ${MAX_ATTACHMENTS} files, 10 MB each. Each file needs a description.`}
      </AppText>
      {replacesOld ? (
        <Alert
          tone="warning"
          message="The files you add here replace the ones on the request. Add again any you still need."
        />
      ) : null}
      {pickError ? (
        <Alert tone="danger" message={pickError} onDismiss={() => setPickError(undefined)} />
      ) : null}
      {attachments.map(({ id, description, file }) => (
        <View key={id} className="gap-3 rounded-xl border border-border bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <View className="size-control items-center justify-center rounded-md bg-primary-soft">
              <Icon name="doc" color="primary" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText variant="body-strong" numberOfLines={1}>
                {file.name}
              </AppText>
              {file.size !== null ? (
                <AppText variant="caption" tone="muted">
                  {formatFileSize(file.size)}
                </AppText>
              ) : null}
            </View>
            <IconButton
              size="sm"
              icon="x"
              label={`Remove ${file.name}`}
              onPress={() => onChange(attachments.filter((item) => item.id !== id))}
            />
          </View>
          <TextField
            label="Description"
            required
            value={description}
            onChangeText={(text) => update(id, text)}
            error={errors[id]}
          />
        </View>
      ))}
      <Button
        variant="soft"
        block
        iconLeft="upload"
        disabled={attachments.length >= MAX_ATTACHMENTS}
        onPress={add}>
        Add file
      </Button>
    </>
  );
}
