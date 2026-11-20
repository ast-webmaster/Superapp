import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  AppText,
  Alert,
  Button,
  DateRangePicker,
  FieldLabel,
  focusRing,
  Icon,
  Sheet,
  TextField,
} from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { useRespondFinding } from '../hooks/use-respond-finding';
import type { AuditFinding } from '../types';
import { errorMessage } from './error-message';

const MAX_RESPONSE = 10_000;

export interface FindingResponseSheetProps {
  uuid: string;
  /** The finding being answered. It stays set while the sheet closes, so the content does not jump. */
  finding: AuditFinding | null;
  visible: boolean;
  onClose: () => void;
  online: boolean;
}

/**
 * The auditee's answer to one finding: the response text and the date it will be fixed by. Either
 * may be empty, because the server keeps a half-filled finding; the card cannot be followed up
 * until every finding has both.
 */
export function FindingResponseSheet({
  uuid,
  finding,
  visible,
  onClose,
  online,
}: FindingResponseSheetProps) {
  const [response, setResponse] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  const { mutate, isPending, error, reset } = useRespondFinding(uuid);

  // Each time the sheet opens it starts from what the server has, not from an abandoned draft.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible && finding) {
      setResponse(finding.auditee_response ?? '');
      setDueDate(finding.due_date);
      setCalendarOpen(false);
      reset();
    }
  }

  const save = () => {
    if (!finding || isPending) return;
    mutate(
      { findingId: finding.id, auditeeResponse: response, dueDate },
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
      title="Your response"
      onClose={onClose}
      footer={
        <Button block loading={isPending} disabled={!online} onPress={save}>
          Save response
        </Button>
      }>
      {finding ? (
        <AppText variant="caption" tone="muted" numberOfLines={3}>
          {finding.audit_finding}
        </AppText>
      ) : null}
      <TextField
        label="Auditee response"
        multiline
        value={response}
        onChangeText={setResponse}
        maxLength={MAX_RESPONSE}
        textAlignVertical="top"
        className="min-h-32"
      />
      <View className="gap-1">
        <FieldLabel>Due date</FieldLabel>
        <View className="flex-row items-center gap-2">
          <Pressable
            role="button"
            aria-label={`Due date, ${dueDate ? formatDate(dueDate) : 'not set'}`}
            aria-expanded={calendarOpen}
            onPress={() => setCalendarOpen((open) => !open)}
            className={clsx(
              'min-h-control min-w-0 flex-1 flex-row items-center gap-3 rounded-lg border-2 border-border bg-surface px-4',
              focusRing,
            )}>
            <Icon name="calendar" color="ink" />
            <AppText tone={dueDate ? 'ink' : 'muted'} numberOfLines={1} className="min-w-0 flex-1">
              {dueDate ? formatDate(dueDate) : 'Choose a date'}
            </AppText>
          </Pressable>
          {dueDate ? (
            <Button
              variant="soft"
              size="sm"
              onPress={() => {
                setDueDate(null);
                setCalendarOpen(false);
              }}>
              Clear
            </Button>
          ) : null}
        </View>
        {calendarOpen ? (
          <DateRangePicker
            value={{ from: dueDate, to: dueDate }}
            initialMonth={dueDate ?? undefined}
            onChange={({ from }) => {
              if (from === null) return;
              setDueDate(from);
              setCalendarOpen(false);
            }}
          />
        ) : null}
      </View>
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to save your response.
        </AppText>
      ) : null}
      {error ? <Alert tone="danger" message={errorMessage(error)} /> : null}
    </Sheet>
  );
}
