import { useState } from 'react';
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

import { useRegisterCustomerAction } from '../hooks/use-register-customer-action';
import type { RegisterCustomerAction, RegisterCustomerDetail } from '../types';
import { CustomerCodeSheet } from './customer-code-sheet';
import { statusBadge } from './status';

/** The server's `max:191` on remarks, and its minimum for a reason to reject or send back. */
const REMARKS_MAX = 191;
const REASON_MIN = 6;

const ACTIONS: Record<
  RegisterCustomerAction,
  {
    label: string;
    question: string;
    reason: 'required' | 'optional';
    icon: IconName;
    destructive?: boolean;
  }
> = {
  confirm: {
    label: 'Confirm',
    question: 'Confirm this registration?',
    reason: 'optional',
    icon: 'check',
  },
  approve: {
    label: 'Approve',
    question: 'Approve this registration?',
    reason: 'optional',
    icon: 'check',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this registration?',
    reason: 'required',
    icon: 'alert',
    destructive: true,
  },
  revise: {
    label: 'Revise',
    question: 'Send this registration back for revision?',
    reason: 'required',
    icon: 'pencil',
  },
};

/** Order on screen: the main action first. */
const ORDER: readonly RegisterCustomerAction[] = ['confirm', 'approve', 'reject', 'revise'];

type ApprovalActionsProps = {
  detail: RegisterCustomerDetail;
  online: boolean;
};

/**
 * The decision bar pinned to the bottom of the detail screen: the actions the server offers
 * this user, and the outcome of the last one (it stays after the actions disappear, since a
 * handled document offers none). Reject and revise ask for their reason in the confirm dialog;
 * the finance approval asks for the customer code in a sheet.
 */
export function ApprovalActions({ detail, online }: ApprovalActionsProps) {
  const action = useRegisterCustomerAction(detail.uuid);
  const confirm = useConfirm();
  const [codeSheet, setCodeSheet] = useState(false);

  const available = ORDER.filter((name) => detail.allowed_actions.includes(name));
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

  const run = (name: RegisterCustomerAction) => {
    if (action.isPending) return;
    if (name === 'approve' && detail.awaiting_stage === 'FINANCE') {
      action.reset();
      setCodeSheet(true);
      return;
    }
    const { question, label, icon, destructive, reason } = ACTIONS[name];
    confirm({
      title: question,
      confirmLabel: label,
      icon,
      destructive,
      reason: {
        label: reason === 'optional' ? 'Remarks (optional)' : 'Reason',
        required: reason === 'required',
        maxLength: REMARKS_MAX,
        minLength: reason === 'required' ? REASON_MIN : undefined,
        requiredMessage: `Enter a reason of at least ${REASON_MIN} characters.`,
      },
      onConfirm: (remarks) =>
        action.mutateAsync({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  const button = (name: RegisterCustomerAction) => {
    const main = name === 'confirm' || name === 'approve';
    return (
      <Button
        key={name}
        block
        variant={main ? 'primary' : 'secondary'}
        className={main ? 'flex-2' : 'flex-1 px-2'}
        loading={action.isPending && action.variables?.action === name}
        disabled={!online || action.isPending}
        onPress={() => run(name)}>
        {ACTIONS[name].label}
      </Button>
    );
  };

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.length > 0 ? (
        <View className="flex-row gap-2">{available.map(button)}</View>
      ) : null}
      {available.length > 0 && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this registration.
        </AppText>
      ) : null}
      <CustomerCodeSheet
        visible={codeSheet}
        onClose={() => setCodeSheet(false)}
        onSubmit={(customerCode) => {
          setCodeSheet(false);
          action.mutate({ action: 'approve', customerCode, updatedAt: detail.updated_at });
        }}
      />
    </ActionBar>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This registration changed before your action was saved. Review the latest version.',
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
