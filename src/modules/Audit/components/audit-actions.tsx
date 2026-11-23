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

import { useAuditAction } from '../hooks/use-audit-action';
import type { AuditAction, AuditDetail } from '../types';
import { statusBadge } from './status';

const REASON_MAX = 2000;
/** Same floor as the other modules, so a rejection always says why. The server does not ask for it. */
const REJECT_MIN = 6;

const ACTIONS: Record<
  AuditAction,
  {
    label: string;
    question: string;
    message: string;
    reason?: 'required' | 'optional';
    icon: IconName;
    destructive?: boolean;
  }
> = {
  start: {
    label: 'Start audit',
    question: 'Start this audit?',
    message: 'The audit moves to On progress.',
    reason: 'optional',
    icon: 'check',
  },
  submit: {
    label: 'Submit audit',
    question: 'Submit this audit?',
    message:
      'The responsible person and the finding PICs are asked to follow up. You can no longer change programs and findings.',
    reason: 'optional',
    icon: 'send',
  },
  follow_up: {
    label: 'Send follow up',
    question: 'Send your follow up?',
    message: 'Every finding needs a response and a due date first. The approver reviews it next.',
    reason: 'optional',
    icon: 'send',
  },
  approve: {
    label: 'Approve',
    question: 'Approve this audit?',
    message: 'The audit is completed and locked.',
    reason: 'optional',
    icon: 'check',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this audit?',
    message: 'The audit is rejected and locked.',
    reason: 'required',
    icon: 'alert',
    destructive: true,
  },
};

/** Order on screen: the forward steps first, reject last. */
const ORDER: readonly AuditAction[] = ['start', 'submit', 'follow_up', 'approve', 'reject'];

type AuditActionsProps = {
  detail: AuditDetail;
  online: boolean;
};

/**
 * The bar pinned to the bottom of the detail screen: the actions the server offers this user,
 * and the outcome of the last one (it stays after the actions disappear, since a completed
 * audit offers none). The reason goes in the confirm dialog.
 */
export function AuditActions({ detail, online }: AuditActionsProps) {
  const action = useAuditAction(detail.uuid);
  const confirm = useConfirm();

  const available = ORDER.filter((name) => detail.allowed_actions.includes(name));
  const main = available.find((name) => name !== 'reject');
  const failure = action.error ? toAppError(action.error) : undefined;
  const outcome = action.isSuccess
    ? {
        tone: 'success' as AlertTone,
        message: `Saved. Status is now ${statusBadge(action.data.status).label}.`,
      }
    : failure
      ? outcomeOf(failure.code, failure.message)
      : undefined;

  if (available.length === 0 && !outcome) return null;

  const run = (name: AuditAction) => {
    if (action.isPending) return;
    const { question, message, label, icon, destructive, reason } = ACTIONS[name];
    confirm({
      title: question,
      message,
      confirmLabel: label,
      icon,
      destructive,
      reason: reason
        ? {
            label: reason === 'optional' ? 'Remarks (optional)' : 'Reason',
            required: reason === 'required',
            maxLength: REASON_MAX,
            minLength: reason === 'required' ? REJECT_MIN : undefined,
            requiredMessage: `Enter a reason of at least ${REJECT_MIN} characters.`,
          }
        : undefined,
      onConfirm: (remarks) => action.mutateAsync({ action: name, remarks }),
    });
  };

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.length > 0 ? (
        <View className="flex-row gap-2">
          {available.map((name) => (
            <Button
              key={name}
              block
              variant={name === main ? 'primary' : 'secondary'}
              className={name === main ? 'flex-2' : 'flex-1 px-2'}
              loading={action.isPending && action.variables?.action === name}
              disabled={!online || action.isPending}
              onPress={() => run(name)}>
              {ACTIONS[name].label}
            </Button>
          ))}
        </View>
      ) : null}
      {available.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this audit.
        </AppText>
      ) : null}
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'network' || code === 'timeout' || code === 'server') {
    return {
      tone: 'danger',
      message: 'Could not confirm your action. Check the status before you try again.',
    };
  }
  // The server's reason: the action is not yours, does not fit the status, or is not ready yet.
  return { tone: 'danger', message };
}
