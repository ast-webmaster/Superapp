import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import {
  Alert,
  AppText,
  Button,
  TextField,
  useConfirm,
  type AlertTone,
  type IconName,
} from '@/shared/ui';

import { usePriceApprovalAction } from '../hooks/use-price-approval-action';
import type { PriceApprovalAction, PriceApprovalDetail } from '../types';
import { statusBadge } from './status';

const ACTIONS: Record<
  PriceApprovalAction,
  { label: string; question: string; needsReason: boolean; icon: IconName; destructive?: boolean }
> = {
  approve: {
    label: 'Approve',
    question: 'Approve this request?',
    needsReason: false,
    icon: 'check',
  },
  reject: {
    label: 'Reject',
    question: 'Reject this request?',
    needsReason: true,
    icon: 'alert',
    destructive: true,
  },
  pending: {
    label: 'Hold',
    question: 'Hold this request and send it back to the requester?',
    needsReason: true,
    icon: 'info',
  },
  no_approval_needed: {
    label: 'Mark no approval needed',
    question: 'Close this request as needing no approval?',
    needsReason: false,
    icon: 'info',
  },
};

/** Order on screen: the main action first. */
const ORDER: readonly PriceApprovalAction[] = [
  'approve',
  'reject',
  'pending',
  'no_approval_needed',
];

type ApprovalActionsProps = {
  detail: PriceApprovalDetail;
  online: boolean;
};

/**
 * The actions the server offers this user, and the outcome of the last one. The outcome
 * stays visible after the actions disappear (an approved request offers none).
 */
export function ApprovalActions({ detail, online }: ApprovalActionsProps) {
  const action = usePriceApprovalAction(detail.pa_uuid);
  const confirm = useConfirm();
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState<string>();

  const available = ORDER.filter((name) => detail.allowed_actions.includes(name));
  const failure = action.error ? toAppError(action.error) : undefined;
  const serverRemarksError =
    failure?.code === 'validation' ? failure.fieldErrors?.remarks?.[0] : undefined;
  const outcome = action.isSuccess
    ? {
        tone: 'success' as AlertTone,
        message: `Saved. Status is now ${statusBadge(action.data.status).label}.`,
      }
    : failure && !serverRemarksError
      ? outcomeOf(failure.code, failure.message)
      : undefined;

  if (available.length === 0 && !outcome) return null;

  const run = (name: PriceApprovalAction) => {
    if (action.isPending) return;
    const reason = remarks.trim();
    if (ACTIONS[name].needsReason && !reason) {
      setRemarksError('Enter a reason to reject or hold this request.');
      return;
    }
    setRemarksError(undefined);
    const { question, label, icon, destructive } = ACTIONS[name];
    confirm({
      title: question,
      confirmLabel: label,
      icon,
      destructive,
      onConfirm: () =>
        action.mutate(
          { action: name, remarks: reason, updatedAt: detail.updated_at },
          { onSuccess: () => setRemarks('') },
        ),
    });
  };

  return (
    <View className="gap-4">
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {available.length > 0 ? (
        <View className="gap-4 rounded-xl bg-surface p-4 shadow-card">
          <AppText variant="module-title" role="heading">
            Your decision
          </AppText>
          {available.some((name) => ACTIONS[name].needsReason) ? (
            <TextField
              label="Reason"
              help="Needed to reject or hold. Optional otherwise."
              value={remarks}
              onChangeText={setRemarks}
              error={remarksError ?? serverRemarksError}
              multiline
              maxLength={255}
              editable={!action.isPending}
            />
          ) : null}
          <View className="gap-3">
            {available.map((name, index) => (
              <Button
                key={name}
                block
                variant={index === 0 ? 'primary' : 'soft'}
                loading={action.isPending && action.variables?.action === name}
                disabled={!online || action.isPending}
                onPress={() => run(name)}>
                {ACTIONS[name].label}
              </Button>
            ))}
          </View>
          {!online ? (
            <AppText variant="caption" tone="muted">
              Connect to the internet to act on this request.
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function outcomeOf(code: string, message: string): { tone: AlertTone; message: string } {
  if (code === 'conflict') {
    return {
      tone: 'warning',
      message: 'This request changed before your action was saved. Review the latest version.',
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
