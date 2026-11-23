import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import {
  ActionBar,
  Alert,
  AppText,
  Button,
  useConfirm,
  type AlertTone,
  type IconName,
} from '@/shared/ui';

import { submitFailureMessage } from '../create/draft';
import type { FlowConfig } from '../flows';
import { useGimmickAction } from '../hooks/use-gimmick-action';
import type { GimmickAction, GimmickDetail } from '../types';
import { statusLabel } from './status';

/** The server only needs a reason to be non-empty, and `remarks` holds 191 characters. */
const REASON_MAX_LENGTH = 191;

type ActionCopy = {
  label: string;
  question: string;
  /** What the dialog's confirm button says, when the bar's short label would not be clear there. */
  confirmLabel?: string;
  icon: IconName;
  destructive?: boolean;
};

const COPY: Record<GimmickAction, ActionCopy> = {
  approve: { label: 'Approve', question: 'Approve this document?', icon: 'check' },
  process: { label: 'Process', question: 'Mark this request as processed?', icon: 'box' },
  receive: { label: 'Receive', question: 'Confirm the items arrived?', icon: 'check' },
  reject: {
    label: 'Reject',
    question: 'Reject this document?',
    icon: 'alert',
    destructive: true,
  },
  cancel: {
    label: 'Cancel',
    question: 'Cancel this document?',
    confirmLabel: 'Cancel document',
    icon: 'x',
    destructive: true,
  },
};

/** Order on screen: the forward action first. */
const ORDER: readonly GimmickAction[] = ['approve', 'process', 'receive', 'reject', 'cancel'];

type DetailActionsProps = {
  flow: FlowConfig;
  detail: GimmickDetail;
  online: boolean;
};

const offered = (detail: GimmickDetail) =>
  ORDER.filter((name) => detail.allowed_actions.includes(name));

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasDetailActions(detail: GimmickDetail) {
  return offered(detail).length > 0;
}

/**
 * The bar pinned to the bottom of the detail screen: what the server offers this user, and the
 * outcome of the last action (it stays after the actions disappear, since a settled document
 * offers none). Reasons are asked for in the confirm dialog.
 */
export function DetailActions({ flow, detail, online }: DetailActionsProps) {
  const action = useGimmickAction(flow.flow, detail.uuid);
  const confirm = useConfirm();

  const available = offered(detail);
  const failure = action.error ? toAppError(action.error) : undefined;
  const outcome = action.isSuccess
    ? {
        tone: 'success' as AlertTone,
        message: `Saved. Status is now ${statusLabel(action.data.status)}.`,
      }
    : failure
      ? outcomeOf(failure.code, submitFailureMessage(failure))
      : undefined;

  if (available.length === 0 && !outcome) return null;

  const run = (name: GimmickAction) => {
    if (action.isPending) return;
    const { question, label, confirmLabel, icon, destructive } = COPY[name];
    confirm({
      title: question,
      confirmLabel: confirmLabel ?? label,
      // The dialog's own Cancel would read the same as the action itself.
      cancelLabel: name === 'cancel' ? 'Keep it' : undefined,
      icon,
      destructive,
      reason: flow.reasonRequired.includes(name)
        ? {
            label: 'Remarks',
            required: true,
            maxLength: REASON_MAX_LENGTH,
            requiredMessage: 'Enter a remark.',
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutateAsync({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.length > 0 ? (
        <View className="flex-row gap-2">
          {available.map((name, index) => (
            <Button
              key={name}
              block
              variant={index === 0 ? 'primary' : 'secondary'}
              className={index === 0 ? 'flex-2' : 'flex-1 px-2'}
              loading={action.isPending && action.variables?.action === name}
              disabled={!online || action.isPending}
              onPress={() => run(name)}>
              {COPY[name].label}
            </Button>
          ))}
        </View>
      ) : null}
      {available.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this document.
        </AppText>
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This document changed before your action was saved. Review the latest version.',
    };
  }
  if (code === 'network' || code === 'timeout' || code === 'server') {
    return {
      tone: 'danger',
      message: 'Could not confirm your action. Check the status before you try again.',
    };
  }
  return { tone: 'danger', message };
}
