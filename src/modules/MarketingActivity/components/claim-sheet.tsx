import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile, type PickedFile } from '@/core/files';
import { AppText, Button, FieldLabel, Icon, IconButton, Sheet } from '@/shared/ui';

/** The server's limit for the proof file of a claim. */
export const MAX_CLAIM_FILE_BYTES = 10 * 1024 * 1024;
/** The extensions the server accepts for it. */
export const CLAIM_EXTENSIONS = [
  'docx',
  'doc',
  'xls',
  'xlsx',
  'csv',
  'jpg',
  'png',
  'pdf',
  'zip',
  'msg',
] as const;

/** Why the app would not send this file, or null when it may go. The server checks again. */
export function claimFileProblem(file: PickedFile): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!(CLAIM_EXTENSIONS as readonly string[]).includes(extension)) {
    return 'That file type is not accepted. Choose a PDF, image, Word, Excel, CSV, ZIP or MSG file.';
  }
  if (file.size !== null && file.size > MAX_CLAIM_FILE_BYTES) {
    return 'That file is larger than 10 MB. Choose a smaller one.';
  }
  return null;
}

/** 1536 -> "1.5 KB". Only for showing how big a chosen file is. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ClaimSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (file: PickedFile) => void;
}

/** A claim needs a proof file, so it cannot use the plain confirm dialog like the other actions. */
export function ClaimSheet({ visible, onClose, onSubmit }: ClaimSheetProps) {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [problem, setProblem] = useState<string>();
  const [wasVisible, setWasVisible] = useState(false);

  // Each time the sheet opens it starts empty, not with the file of an earlier attempt.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setFile(null);
      setProblem(undefined);
    }
  }

  const choose = async () => {
    setProblem(undefined);
    try {
      const picked = await pickFile();
      if (!picked) return;
      const rejected = claimFileProblem(picked);
      if (rejected) setProblem(rejected);
      else setFile(picked);
    } catch (failure) {
      setProblem(toAppError(failure).message);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Claim"
      onClose={onClose}
      footer={
        <Button block disabled={file === null} onPress={() => file && onSubmit(file)}>
          Submit claim
        </Button>
      }>
      <View className="gap-2">
        <FieldLabel required>Proof file</FieldLabel>
        {file ? (
          <View className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <Icon name="doc" color="primary" />
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
              onPress={() => setFile(null)}
            />
          </View>
        ) : (
          <Button variant="soft" block iconLeft="upload" onPress={choose}>
            Choose file
          </Button>
        )}
        <AppText variant="caption" tone={problem ? 'danger' : 'muted'} aria-live="polite">
          {problem ?? 'PDF, image, Word, Excel, CSV, ZIP or MSG, up to 10 MB.'}
        </AppText>
      </View>
    </Sheet>
  );
}
