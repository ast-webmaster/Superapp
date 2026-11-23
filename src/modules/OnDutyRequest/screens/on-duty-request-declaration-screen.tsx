import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import {
  ActionBar,
  Alert,
  AppText,
  Button,
  EmptyState,
  ListGroup,
  ListRow,
  Screen,
  TextField,
  useConfirm,
} from '@/shared/ui';
import { formatMoney } from '@/shared/utils/format';

import { DeclarationCostCard } from '../components/declaration/declaration-cost-card';
import { DeclarationDestinationCard } from '../components/declaration/declaration-destination-card';
import { QueryStatus } from '../components/query-status';
import {
  declaredTotal,
  draftFromDeclaration,
  isDeclarationDirty,
  validateDeclaration,
} from '../create/declaration-draft';
import { submitFailureMessage } from '../create/draft';
import { useOnDutyRequest } from '../hooks/use-on-duty-request';
import { useSubmitDeclaration } from '../hooks/use-submit-declaration';
import { onDutyRequestRoutes } from '../navigation/routes';
import type {
  DeclarationCostDraft,
  DeclarationDestinationDraft,
  OnDutyRequestDetail,
} from '../types';

/** The declaration: what the trip really cost, with a receipt for every cost. */
export function OnDutyRequestDeclarationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error, fetchStatus, refetch } = useOnDutyRequest(id);

  if (!data) {
    return (
      <Screen>
        <QueryStatus
          subject="the request"
          error={error}
          offline={fetchStatus === 'paused'}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }
  if (!data.can_declare) {
    return (
      <Screen>
        <EmptyState
          icon="clipboard"
          title="The declaration is closed"
          description="It cannot be sent or changed in the current status. Go back to see it."
        />
      </Screen>
    );
  }
  return <DeclarationForm detail={data} />;
}

function DeclarationForm({ detail }: { detail: OnDutyRequestDetail }) {
  const confirm = useConfirm();
  const online = useIsOnline();
  const { mutateAsync, isPending, error, reset } = useSubmitDeclaration(detail.uuid);

  // Taken once: a later refetch of the detail must not replace what the user is typing.
  const [initial] = useState(() => draftFromDeclaration(detail));
  const [draft, setDraft] = useState(initial);
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);

  const errors = attempted ? validateDeclaration(draft) : {};

  usePreventRemove(isDeclarationDirty(draft, initial) && !saved, ({ repeat }) =>
    confirm({
      title: 'Discard your changes?',
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: repeat,
    }),
  );

  useEffect(() => {
    if (saved) router.dismissTo(onDutyRequestRoutes.detail(detail.uuid) as never);
  }, [saved, detail.uuid]);

  const updateCost = (id: number, patch: Partial<DeclarationCostDraft>) => {
    reset();
    setDraft((current) => ({
      ...current,
      costs: current.costs.map((cost) => (cost.id === id ? { ...cost, ...patch } : cost)),
    }));
  };

  const updateDestination = (uuid: string, patch: Partial<DeclarationDestinationDraft>) => {
    reset();
    setDraft((current) => ({
      ...current,
      destinations: current.destinations.map((row) =>
        row.uuid === uuid ? { ...row, ...patch } : row,
      ),
    }));
  };

  const submit = () => {
    if (Object.keys(validateDeclaration(draft)).length > 0) {
      setAttempted(true);
      return;
    }
    confirm({
      title: detail.declaration ? 'Send the declaration again?' : 'Send the declaration?',
      message: 'It goes to the approvers straight away.',
      confirmLabel: 'Send',
      icon: 'clipboard',
      success: { title: 'Declaration sent' },
      onConfirm: () => {
        if (isPending) return;
        return mutateAsync(draft).then(() => setSaved(true));
      },
    });
  };

  const failure = error ? toAppError(error) : null;

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <AppText tone="muted">
          Report what each cost really was and attach its receipt. Every cost needs both.
        </AppText>
        {attempted && Object.keys(errors).length > 0 ? (
          <Alert
            tone="danger"
            message="Some costs are not complete. Check the fields marked in red."
          />
        ) : null}
        {draft.costs.map((cost) => (
          <DeclarationCostCard
            key={cost.id}
            cost={cost}
            errors={errors}
            onChange={(patch) => updateCost(cost.id, patch)}
          />
        ))}
        {draft.destinations.map((row) => (
          <DeclarationDestinationCard
            key={row.uuid}
            row={row}
            error={errors[row.uuid]}
            onChange={(patch) => updateDestination(row.uuid, patch)}
          />
        ))}
        <TextField
          label="Notes"
          value={draft.notes}
          onChangeText={(notes) => {
            reset();
            setDraft((current) => ({ ...current, notes }));
          }}
          multiline
          textAlignVertical="top"
          className="min-h-20"
        />
        <ListGroup>
          <ListRow label="Estimated costs" value={formatMoney(detail.total)} />
          <ListRow label="Actual costs" value={formatMoney(declaredTotal(draft))} />
        </ListGroup>
        {failure ? (
          <Alert
            tone={failure.code === 'validation' ? 'danger' : 'warning'}
            message={
              failure.code === 'validation' ||
              failure.code === 'forbidden' ||
              failure.code === 'conflict'
                ? submitFailureMessage(failure)
                : `${failure.message} Open the request to check its status before you send it again.`
            }
          />
        ) : null}
      </ScrollView>
      <ActionBar>
        {!online ? (
          <AppText variant="caption" tone="muted">
            You are offline. Connect to send.
          </AppText>
        ) : null}
        <View>
          <Button block loading={isPending} disabled={!online} onPress={submit}>
            Send declaration
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
