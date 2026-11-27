import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile, type PickedFile } from '@/core/files';
import { AppText, Button, FieldLabel, Icon, IconButton } from '@/shared/ui';

import { fileProblem, type FileRule } from '../../create/files';

export interface FileFieldProps {
  label: string;
  required?: boolean;
  rule: FileRule;
  /** The file chosen on this device. */
  value: PickedFile | null;
  /** The name of the file the server already holds for this slot. It stays unless a file replaces it. */
  kept?: string | null;
  onChange: (file: PickedFile | null) => void;
  error?: string;
}

/** 1536 -> "1.5 KB". Only for showing how big a chosen file is. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * One file. A file the server already holds is shown as kept, and choosing another replaces it:
 * the API cannot delete a single reference, so a kept file has no remove button. The server checks
 * the type and size again.
 */
export function FileField({ label, required, rule, value, kept, onChange, error }: FileFieldProps) {
  const [pickError, setPickError] = useState<string>();

  const choose = async () => {
    setPickError(undefined);
    try {
      const file = await pickFile();
      if (!file) return;
      const problem = fileProblem(file, rule);
      if (problem) {
        setPickError(problem);
        return;
      }
      onChange(file);
    } catch (failure) {
      setPickError(toAppError(failure).message);
    }
  };

  const message = pickError ?? error;
  const current = value ? value.name : (kept ?? null);

  return (
    <View className="gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      {current ? (
        <View className="flex-row items-center gap-3 rounded-lg shadow-card bg-surface p-3">
          <Icon name="doc" color="primary" />
          <View className="min-w-0 flex-1">
            <AppText variant="body-strong" numberOfLines={1}>
              {current}
            </AppText>
            <AppText variant="caption" tone="muted">
              {value
                ? value.size !== null
                  ? formatFileSize(value.size)
                  : 'New file'
                : 'Already uploaded'}
            </AppText>
          </View>
          {value ? (
            <IconButton
              size="sm"
              icon="x"
              label={`Remove ${value.name}`}
              onPress={() => onChange(null)}
            />
          ) : (
            <Button variant="soft" size="sm" onPress={choose}>
              Replace
            </Button>
          )}
        </View>
      ) : (
        <Button variant="soft" block iconLeft="upload" onPress={choose}>
          Choose file
        </Button>
      )}
      <AppText variant="caption" tone={message ? 'danger' : 'muted'} aria-live="polite">
        {message ?? rule.hint}
      </AppText>
    </View>
  );
}
