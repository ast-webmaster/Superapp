import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { pickFile } from '@/core/files';
import {
  Alert,
  AppText,
  Button,
  FieldLabel,
  Icon,
  IconButton,
  TextField,
} from '@/shared/ui';

import { documentProblem, documentRequirement, type Errors } from '../../create/draft';
import { DOCUMENTS, YES_NO } from '../../create/options';
import type { DocumentKey, RegisterCustomerDraft } from '../../types';
import { ChoiceField } from './choice-field';

/** 1536 -> "1.5 KB". Only for showing how big a chosen file is. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface DocumentsStepProps {
  draft: RegisterCustomerDraft;
  onChange: (patch: Partial<RegisterCustomerDraft>) => void;
  /** Field errors to show. Empty until the user tries to continue. */
  errors: Errors;
}

export function DocumentsStep({ draft, onChange, errors }: DocumentsStepProps) {
  const [pickError, setPickError] = useState<string>();

  const choose = async (key: DocumentKey) => {
    setPickError(undefined);
    try {
      const file = await pickFile();
      if (!file) return;
      const problem = documentProblem(file);
      if (problem) {
        setPickError(`${file.name}: ${problem}`);
        return;
      }
      onChange({ documents: { ...draft.documents, [key]: file } });
    } catch (error) {
      setPickError(toAppError(error).message);
    }
  };

  const remove = (key: DocumentKey) => {
    const { [key]: _removed, ...rest } = draft.documents;
    onChange({ documents: rest });
  };

  return (
    <>
      <View className="gap-4">
        <ChoiceField
          label="Part of a group"
          required
          options={YES_NO}
          value={draft.isGrouping}
          onChange={(isGrouping) => onChange({ isGrouping })}
          error={errors.isGrouping}
        />
        {draft.isGrouping === 'YES' ? (
          <TextField
            label="Group company name"
            required
            value={draft.groupingCompanyName}
            onChangeText={(groupingCompanyName) => onChange({ groupingCompanyName })}
            maxLength={191}
            error={errors.groupingCompanyName}
          />
        ) : null}
      </View>

      <View className="gap-4">
        <AppText tone="muted">JPG, PNG or PDF, up to 2 MB each.</AppText>
        {pickError ? (
          <Alert tone="danger" message={pickError} onDismiss={() => setPickError(undefined)} />
        ) : null}
        {DOCUMENTS.map(({ key, label }) => {
          const requirement = documentRequirement(key, draft);
          if (requirement === 'hidden') return null;
          const file = draft.documents[key];

          return (
            <View
              key={key}
              className="gap-3 rounded-xl border border-border bg-surface p-4">
              <FieldLabel required={requirement === 'required'}>{label}</FieldLabel>
              {file ? (
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
                    label={`Remove ${label}`}
                    onPress={() => remove(key)}
                  />
                </View>
              ) : (
                <Button variant="soft" block iconLeft="upload" onPress={() => choose(key)}>
                  Choose file
                </Button>
              )}
              {errors[key] ? (
                <AppText variant="caption" tone="danger" aria-live="polite">
                  {errors[key]}
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>
    </>
  );
}
