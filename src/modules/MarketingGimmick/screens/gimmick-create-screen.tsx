import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, TextField, useConfirm } from '@/shared/ui';

import { DocumentField } from '../components/create/document-field';
import { ItemForm } from '../components/create/item-form';
import { ItemsSection, itemName } from '../components/create/items-section';
import { LookupField } from '../components/create/lookup-field';
import {
  emptyDraft,
  isDirty,
  MAX_REMARKS,
  newItem,
  submitFailureMessage,
  totalQty,
  validateForm,
} from '../create/draft';
import { flows } from '../flows';
import { useSubmitGimmick } from '../hooks/use-submit-gimmick';
import { useOfficeOptions } from '../hooks/use-lookups';
import { gimmickRoutes } from '../navigation/routes';
import type { DraftItem, GimmickDraft, GimmickFlow, OfficeOption } from '../types';

/**
 * One form for a new document of either flow. A request also asks for a destination office. The
 * document is saved and submitted in one call; the draft is `useState`, lost on leaving.
 */
export function GimmickCreateScreen({ flow: flowKey }: { flow: GimmickFlow }) {
  const flow = flows[flowKey];
  const confirm = useConfirm();
  const online = useIsOnline();
  const { mutateAsync, isPending, error } = useSubmitGimmick(flowKey);

  const [draft, setDraft] = useState<GimmickDraft>(emptyDraft);
  // Errors stay hidden until the user tries to submit, so a fresh form is not red.
  const [attempted, setAttempted] = useState(false);
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [savedUuid, setSavedUuid] = useState<string | null>(null);

  const errors = attempted ? validateForm(flow, draft) : {};
  const update = (patch: Partial<GimmickDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const useOffices = (search: string, enabled: boolean) =>
    useOfficeOptions(flowKey, search, enabled);

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft) && savedUuid === null, ({ repeat }) =>
    confirm({
      title: `Discard this ${flow.noun}?`,
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: repeat,
    }),
  );

  useEffect(() => {
    if (savedUuid) router.replace(gimmickRoutes.detail(flowKey, savedUuid) as never);
  }, [savedUuid, flowKey]);

  const submit = () => {
    if (Object.keys(validateForm(flow, draft)).length > 0) {
      setAttempted(true);
      return;
    }
    confirm({
      title: `Submit this ${flow.noun}?`,
      message: flow.needsOffice
        ? 'It goes into the approval flow straight away, and Head Office stock is reserved.'
        : 'It goes to the approver straight away.',
      confirmLabel: 'Submit',
      icon: 'clipboard',
      success: { title: `${flow.title.replace('Marketing ', '')} submitted` },
      onConfirm: () => {
        if (isPending) return;
        return mutateAsync(draft).then((detail) => setSavedUuid(detail.uuid));
      },
    });
  };

  const failure = error ? toAppError(error) : null;

  // An item form is a screen of its own, with its own pinned Save and Cancel.
  if (editing) {
    const exists = draft.items.some(({ id }) => id === editing.id);
    return (
      <Screen>
        <ItemForm
          flow={flow}
          title={exists ? 'Edit item' : 'New item'}
          initial={editing}
          others={draft.items.filter(({ id }) => id !== editing.id)}
          onSave={(row) => {
            update({
              items: exists
                ? draft.items.map((item) => (item.id === row.id ? row : item))
                : [...draft.items, row],
            });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        {flow.needsOffice ? (
          <LookupField<OfficeOption>
            label="Destination office"
            required
            placeholder="Choose an office"
            sheetTitle="Choose office"
            value={draft.office}
            onChange={(office) => update({ office })}
            useOptions={useOffices}
            getKey={(office) => String(office.id)}
            getTitle={(office) => office.name}
            localSearch
            error={errors.office}
          />
        ) : null}
        <TextField
          label="Remarks"
          required
          multiline
          maxLength={MAX_REMARKS}
          value={draft.remarks}
          onChangeText={(remarks) => update({ remarks })}
          error={errors.remarks}
        />
        <DocumentField
          label={flow.docLabel}
          required={flow.docRequired}
          value={draft.doc}
          onChange={(doc) => update({ doc })}
          error={errors.doc}
        />
        <ItemsSection
          items={draft.items}
          error={errors.items}
          onAdd={() => setEditing(newItem())}
          onEdit={setEditing}
          onRemove={(row) =>
            confirm({
              title: 'Remove this item?',
              message: itemName(row),
              confirmLabel: 'Remove',
              destructive: true,
              onConfirm: () => update({ items: draft.items.filter(({ id }) => id !== row.id) }),
            })
          }
        />
        {failure ? (
          <Alert
            tone={failure.code === 'validation' ? 'danger' : 'warning'}
            message={
              failure.code === 'validation' ||
              failure.code === 'forbidden' ||
              failure.code === 'conflict'
                ? submitFailureMessage(failure)
                : `${failure.message} Check the list before you send it again.`
            }
          />
        ) : null}
      </ScrollView>
      <ActionBar>
        {!online ? (
          <AppText variant="caption" tone="muted">
            You are offline. Connect to submit.
          </AppText>
        ) : draft.items.length > 0 ? (
          <AppText variant="caption" tone="muted">
            {`${draft.items.length} ${draft.items.length === 1 ? 'item' : 'items'} · ${totalQty(draft)} units`}
          </AppText>
        ) : null}
        <View>
          <Button block loading={isPending} disabled={!online} onPress={submit}>
            {`Submit ${flow.noun}`}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
