import { router } from 'expo-router';
import { View } from 'react-native';

import { ActionBar, AppText, Button, useConfirm, type IconName } from '@/shared/ui';

import { useDeleteSalesVisitation } from '../hooks/use-delete-sales-visitation';
import { salesVisitationRoutes } from '../navigation/routes';
import type { DetailAction, SalesVisitationDetail } from '../types';

type ActionCopy = { label: string; icon: IconName };

const COPY: Record<DetailAction, ActionCopy> = {
  check_in: { label: 'Check in', icon: 'pin' },
  check_out: { label: 'Check out', icon: 'check' },
  update: { label: 'Edit', icon: 'pencil' },
  delete: { label: 'Delete', icon: 'x' },
};

/** Order on screen: the forward action first, the way out last. */
const ORDER: readonly DetailAction[] = ['check_in', 'check_out', 'update', 'delete'];

const offered = (detail: SalesVisitationDetail) =>
  ORDER.filter((name) => detail.allowed_actions.includes(name));

/** True when the bar has something to show, so the screen can leave room for it. */
export function hasDetailActions(detail: SalesVisitationDetail) {
  return offered(detail).length > 0;
}

type DetailActionsProps = {
  detail: SalesVisitationDetail;
  online: boolean;
};

/**
 * The bar pinned to the bottom of the detail screen: what the server offers this user, nothing
 * more. Check-in and check-out open their own screen (they need the GPS and the camera), edit opens
 * the form, and delete asks first. The app never decides what is allowed.
 */
export function DetailActions({ detail, online }: DetailActionsProps) {
  const confirm = useConfirm();
  const remove = useDeleteSalesVisitation(detail.uuid);
  const available = offered(detail);

  if (available.length === 0) return null;

  const run = (name: DetailAction) => {
    if (remove.isPending) return;
    if (name === 'check_in') router.push(salesVisitationRoutes.checkIn(detail.uuid) as never);
    else if (name === 'check_out')
      router.push(salesVisitationRoutes.checkOut(detail.uuid) as never);
    else if (name === 'update') router.push(salesVisitationRoutes.edit(detail.uuid) as never);
    else {
      confirm({
        title: 'Delete this visit?',
        message: detail.title,
        confirmLabel: 'Delete',
        icon: 'x',
        destructive: true,
        success: { title: 'Visit deleted' },
        onConfirm: () => remove.mutateAsync().then(() => router.back()),
      });
    }
  };

  const [primary, ...others] = available;

  return (
    <ActionBar>
      {primary ? (
        <Button
          block
          iconLeft={COPY[primary].icon}
          disabled={!online || remove.isPending}
          onPress={() => run(primary)}>
          {COPY[primary].label}
        </Button>
      ) : null}
      {others.length > 0 ? (
        <View className="flex-row gap-2">
          {others.map((name) => (
            <Button
              key={name}
              block
              className="flex-1"
              variant="secondary"
              iconLeft={COPY[name].icon}
              disabled={!online || remove.isPending}
              onPress={() => run(name)}>
              {COPY[name].label}
            </Button>
          ))}
        </View>
      ) : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to act on this visit.
        </AppText>
      ) : null}
    </ActionBar>
  );
}
