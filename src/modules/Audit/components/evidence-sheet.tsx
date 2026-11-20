import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { pickFile, type PickedFile } from '@/core/files';
import { Alert, AppText, Button, Icon, Sheet, TextField } from '@/shared/ui';

import { useUploadFindingAttachment } from '../hooks/use-upload-finding-attachment';
import type { AuditFinding } from '../types';
import { errorMessage } from './error-message';
import { fileProblem } from './file-problem';

export interface EvidenceSheetProps {
  uuid: string;
  finding: AuditFinding | null;
  visible: boolean;
  onClose: () => void;
  online: boolean;
}

/** Adds one evidence file, with a description, to a finding. */
export function EvidenceSheet({ uuid, finding, visible, onClose, online }: EvidenceSheetProps) {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [description, setDescription] = useState('');
  const [pickError, setPickError] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(false);
  const { mutate, isPending, error, reset } = useUploadFindingAttachment(uuid);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setFile(null);
      setDescription('');
      setPickError(null);
      reset();
    }
  }

  const choose = async () => {
    try {
      const picked = await pickFile();
      if (!picked) return;
      reset();
      const problem = fileProblem(picked);
      setPickError(problem);
      setFile(problem ? null : picked);
    } catch (failure) {
      setPickError(errorMessage(failure));
    }
  };

  const upload = () => {
    if (!finding || !file || isPending) return;
    mutate(
      { findingId: finding.id, file, description },
      {
        onSuccess: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet
      visible={visible}
      title="Add evidence"
      onClose={onClose}
      footer={
        <Button
          block
          loading={isPending}
          disabled={!online || !file || description.trim() === ''}
          onPress={upload}>
          Upload file
        </Button>
      }>
      <TextField
        label="Description"
        required
        value={description}
        onChangeText={setDescription}
        maxLength={255}
      />
      <View className="gap-2">
        <Button variant="soft" iconLeft="upload" disabled={isPending} onPress={() => void choose()}>
          {file ? 'Choose another file' : 'Choose file'}
        </Button>
        {file ? (
          <View className="flex-row items-center gap-2">
            <Icon name="doc" color="ink" />
            <AppText variant="caption" numberOfLines={1} className="min-w-0 flex-1">
              {file.name}
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" tone="muted">
            Up to 30 MB: PDF, Word, Excel, CSV, image, MSG or ZIP.
          </AppText>
        )}
      </View>
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to upload a file.
        </AppText>
      ) : null}
      {pickError ? <Alert tone="danger" message={pickError} /> : null}
      {error ? <Alert tone="danger" message={errorMessage(error)} /> : null}
    </Sheet>
  );
}
