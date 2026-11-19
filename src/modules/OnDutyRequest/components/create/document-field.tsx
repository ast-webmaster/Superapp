import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile, type PickedFile } from '@/core/files';
import { AppText, Button, FieldLabel, Icon, IconButton } from '@/shared/ui';

import { MAX_FILE_BYTES } from '../../create/draft';
import { formatFileSize } from './file-size';

export interface DocumentFieldProps {
  label: string;
  required?: boolean;
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  error?: string;
  /** Replaces the default hint under the field, for example to say a file is already stored. */
  help?: string;
}

/** One file of up to 10 MB: the letter of assignment, or a receipt. The server checks the type too. */
export function DocumentField({
  label,
  required,
  value,
  onChange,
  error,
  help,
}: DocumentFieldProps) {
  const [pickError, setPickError] = useState<string>();

  const choose = async () => {
    setPickError(undefined);
    try {
      const file = await pickFile();
      if (!file) return;
      if (file.size !== null && file.size > MAX_FILE_BYTES) {
        setPickError('That file is larger than 10 MB. Choose a smaller one.');
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
        <View className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3">
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
        {message ?? help ?? 'PDF, image, Word or Excel, up to 10 MB.'}
      </AppText>
    </View>
  );
}
