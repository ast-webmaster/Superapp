import { useState } from 'react';

import type { PickedFile } from '@/core/files';
import { Alert, AppText, Button, Sheet, TextField } from '@/shared/ui';

import { fileProblem, linkProblem, MAX_LINK, RESULT_RULE } from '../../create/files';
import { ChoiceField } from '../create/choice-field';
import { FileField } from '../create/file-field';
import { failureOutcome } from '../write-outcome';
import type { ActionSheetProps } from './due-date-sheet';

const TYPES = [
  { value: 'LINK', label: 'Link' },
  { value: 'FILE', label: 'File' },
];

/**
 * The designer hands in the finished work, as a link or a file. The request then waits for an
 * approver. The server checks the link and the file again.
 */
export function SubmitResultSheet({ detail, online, action, onClose }: ActionSheetProps) {
  const [type, setType] = useState<'LINK' | 'FILE'>('LINK');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [attempted, setAttempted] = useState(false);

  const problem =
    type === 'LINK'
      ? linkProblem(link)
      : file
        ? fileProblem(file, RESULT_RULE)
        : 'Choose the file to send.';

  const submit = () => {
    if (action.isPending) return;
    if (problem) {
      setAttempted(true);
      return;
    }
    const base = { action: 'submit_file' as const, updatedAt: detail.updated_at };
    action.mutate(
      type === 'LINK'
        ? { ...base, fileType: 'LINK', fileLink: link.trim() }
        : { ...base, fileType: 'FILE', file: file! },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      visible
      fullHeight
      title="Send result"
      onClose={onClose}
      footer={
        <Button block loading={action.isPending} disabled={!online} onPress={submit}>
          Send result
        </Button>
      }>
      <ChoiceField
        label="Send as"
        options={TYPES}
        value={type}
        onChange={(value) => {
          setType(value as 'LINK' | 'FILE');
          setAttempted(false);
        }}
      />
      {type === 'LINK' ? (
        <TextField
          label="Link"
          required
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_LINK}
          value={link}
          onChangeText={setLink}
          error={attempted ? problem : undefined}
        />
      ) : (
        <FileField
          label="File"
          required
          rule={RESULT_RULE}
          value={file}
          onChange={setFile}
          error={attempted ? problem : undefined}
        />
      )}
      <AppText variant="caption" tone="muted">
        An approver reviews it next. You cannot change it after you send it.
      </AppText>
      {action.error ? <Alert {...failureOutcome(action.error)} /> : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to send the result.
        </AppText>
      ) : null}
    </Sheet>
  );
}
