import { router, type Href } from 'expo-router';
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

import { useOnDutyRequestAction } from '../hooks/use-on-duty-request-action';
import { onDutyRequestRoutes } from '../navigation/routes';
import type { OnDutyRequestAction, OnDutyRequestDetail } from '../types';
import { statusBadge } from './status';

/** The server's limit for a reason (`remarks` is at most 1000 characters). */
const REASON_MAX_LENGTH = 1000;

type ActionCopy = {
  label: string;
  question: string;
  /** What the dialog's confirm button says, when the bar's short label would not be clear there. */
  confirmLabel?: string;
  reason?: 'required' | 'optional';
  icon: IconName;
  destructive?: boolean;
};

/** A cancel takes back the declaration while one is open, and the request otherwise. */
function copyOf(name: OnDutyRequestAction, declaring: boolean): ActionCopy {
  const noun = declaring ? 'declaration' : 'request';
  switch (name) {
    case 'approve':
      return {
        label: 'Approve',
        question: `Approve this ${noun}?`,
        reason: 'optional',
        icon: 'check',
      };
    case 'revise':
      return {
        label: 'Revise',
        question: `Send this ${noun} back for revision?`,
        reason: 'required',
        icon: 'info',
      };
    case 'reject':
      return {
        label: 'Reject',
        question: `Reject this ${noun}?`,
        reason: 'required',
        icon: 'alert',
        destructive: true,
      };
    case 'cancel':
      return {
        label: 'Cancel',
        question: `Cancel this ${noun}?`,
        confirmLabel: `Cancel ${noun}`,
        reason: 'optional',
        icon: 'x',
        destructive: true,
      };
  }
}

/** Order on screen: the forward action first. */
const ORDER: readonly OnDutyRequestAction[] = ['approve', 'revise', 'reject', 'cancel'];

type DetailActionsProps = {
  detail: OnDutyRequestDetail;
  online: boolean;
};

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasDetailActions(detail: OnDutyRequestDetail) {
  return detail.allowed_actions.length > 0 || detail.can_resubmit || detail.can_declare;
}

/**
 * The bar pinned to the bottom of the detail screen: what the server offers this user (approve,
 * revise, reject, cancel), the requester's own next step (fix a returned request, send the
 * declaration), and the outcome of the last action (it stays after the actions disappear, since a
 * finished document offers none). Revise and reject ask for their reason in the confirm dialog.
 */
export function DetailActions({ detail, online }: DetailActionsProps) {
  const action = useOnDutyRequestAction(detail.uuid);
  const confirm = useConfirm();

  const declaring = detail.status.includes('DECLARATION');
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

  if (!hasDetailActions(detail) && !outcome) return null;

  const run = (name: OnDutyRequestAction) => {
    if (action.isPending) return;
    const { question, label, confirmLabel, icon, destructive, reason } = copyOf(name, declaring);
    confirm({
      title: question,
      confirmLabel: confirmLabel ?? label,
      // The dialog's own Cancel would read the same as the action itself.
      cancelLabel: name === 'cancel' ? 'Keep it' : undefined,
      icon,
      destructive,
      reason: reason
        ? {
            label: reason === 'optional' ? 'Reason (optional)' : 'Reason',
            required: reason === 'required',
            maxLength: REASON_MAX_LENGTH,
            requiredMessage: 'Enter a reason to reject or send back.',
          }
        : undefined,
      onConfirm: (remarks) =>
        action.mutateAsync({ action: name, remarks, updatedAt: detail.updated_at }),
    });
  };

  // The requester's own step comes first, then the approver's actions.
  const own = detail.can_resubmit
    ? {
        label: 'Revise and resubmit',
        route: onDutyRequestRoutes.resubmit(detail.uuid),
      }
    : detail.can_declare
      ? {
          label: detail.declaration ? 'Edit declaration' : 'Send declaration',
          route: onDutyRequestRoutes.declaration(detail.uuid),
        }
      : null;
  const hasButtons = own !== null || available.length > 0;

  return (
    <ActionBar>
      {outcome ? (
        <Alert tone={outcome.tone} message={outcome.message} onDismiss={action.reset} />
      ) : null}
      {hasButtons ? (
        <View className="flex-row gap-2">
          {own ? (
            <Button
              block
              className="flex-2"
              disabled={!online || action.isPending}
              onPress={() => router.push(own.route as Href)}>
              {own.label}
            </Button>
          ) : null}
          {available.map((name, index) => (
            <Button
              key={name}
              block
              variant={index === 0 && !own ? 'primary' : 'secondary'}
              className={index === 0 && !own ? 'flex-2' : 'flex-1 px-2'}
              loading={action.isPending && action.variables?.action === name}
              disabled={!online || action.isPending}
              onPress={() => run(name)}>
              {copyOf(name, declaring).label}
            </Button>
          ))}
        </View>
      ) : null}
      {hasButtons && !online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this request.
        </AppText>
      ) : null}
    </ActionBar>
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
