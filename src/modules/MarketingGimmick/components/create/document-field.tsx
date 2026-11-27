import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile, type PickedFile } from '@/core/files';
import { AppText, Button, FieldLabel, Icon, IconButton } from '@/shared/ui';

import { fileProblem } from '../../create/draft';

export interface DocumentFieldProps {
  label: string;
  required?: boolean;
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  error?: string;
}

/** 1536 -> "1.5 KB". Only for showing how big a chosen file is. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** One JPG, PNG or PDF of up to 2 MB. The server checks the type and size again. */
export function DocumentField({ label, required, value, onChange, error }: DocumentFieldProps) {
  const [pickError, setPickError] = useState<string>();

  const choose = async () => {
    setPickError(undefined);
    try {
      const file = await pickFile();
      if (!file) return;
      const problem = fileProblem(file);
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

  return (
    <View className="gap-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      {value ? (
        <View className="flex-row items-center gap-3 rounded-lg shadow-card bg-surface p-3">
          <Icon name="doc" color="primary" />
          <View className="min-w-0 flex-1">
            <AppText variant="body-strong" numberOfLines={1}>
              {value.name}
            </AppText>
            {value.size !== null ? (
              <AppText variant="caption" tone="muted">
                {formatFileSize(value.size)}
              </AppText>
            ) : null}
          </View>
          <IconButton
            size="sm"
            icon="x"
            label={`Remove ${value.name}`}
            onPress={() => onChange(null)}
          />
        </View>
      ) : (
        <Button variant="soft" block iconLeft="upload" onPress={choose}>
          Choose file
        </Button>
      )}
      <AppText variant="caption" tone={message ? 'danger' : 'muted'} aria-live="polite">
        {message ?? 'JPG, PNG or PDF, up to 2 MB.'}
      </AppText>
    </View>
  );
}
