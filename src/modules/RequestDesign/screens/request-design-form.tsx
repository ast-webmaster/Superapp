import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, TextField, useConfirm } from '@/shared/ui';

import { BrandField } from '../components/create/brand-field';
import { DateField } from '../components/create/date-field';
import { ItemForm } from '../components/create/item-form';
import { ItemsSection, itemName } from '../components/create/items-section';
import {
  isDirty,
  MAX_DESCRIPTION,
  MAX_THEME,
  newItem,
  submitFailureMessage,
  totalQty,
  validateForm,
} from '../create/draft';
import { useSaveRequestDesign } from '../hooks/use-save-request-design';
import { requestDesignRoutes } from '../navigation/routes';
import type { DraftItem, RequestDesignDraft, RequestDesignOptions } from '../types';

export interface RequestDesignFormProps {
  options: RequestDesignOptions;
  /** What the form starts with: empty for a new request, the server's copy for an edit. */
  initial: RequestDesignDraft;
  /** Set to edit this document, filled in from the version with this `updatedAt`. */
  edit?: { uuid: string; updatedAt: string };
}

/**
 * One form behind both a new request and the edit of one still waiting to be picked. The document
 * is saved and submitted in one call; the draft is `useState`, lost on leaving.
 */
export function RequestDesignForm({ options, initial, edit }: RequestDesignFormProps) {
  const confirm = useConfirm();
  const online = useIsOnline();
  const { mutateAsync, isPending, error } = useSaveRequestDesign(edit);

  const [draft, setDraft] = useState<RequestDesignDraft>(initial);
  // Errors stay hidden until the user tries to submit, so a fresh form is not red.
  const [attempted, setAttempted] = useState(false);
  const [editing, setEditing] = useState<DraftItem | null>(null);
  const [savedUuid, setSavedUuid] = useState<string | null>(null);

  const errors = attempted ? validateForm(draft) : {};
  const update = (patch: Partial<RequestDesignDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft, initial) && savedUuid === null, ({ repeat }) =>
    confirm({
      title: edit ? 'Discard your changes?' : 'Discard this request?',
      message: 'What you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      icon: 'alert',
      destructive: true,
      onConfirm: repeat,
    }),
  );

  useEffect(() => {
    if (!savedUuid) return;
    // A new request replaces the form; an edit goes back to the document it was opened from.
    if (edit) router.dismissTo(requestDesignRoutes.detail(savedUuid) as never);
    else router.replace(requestDesignRoutes.detail(savedUuid) as never);
  }, [savedUuid, edit]);

  const submit = () => {
    if (Object.keys(validateForm(draft)).length > 0) {
      setAttempted(true);
      return;
    }
    confirm({
      title: edit ? 'Save your changes?' : 'Submit this request?',
      message: edit
        ? 'The designer is told about the changes.'
        : 'It goes to the graphic designers straight away.',
      confirmLabel: edit ? 'Save' : 'Submit',
      icon: 'clipboard',
      success: { title: edit ? 'Request saved' : 'Request submitted' },
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
          title={exists ? 'Edit item' : 'New item'}
          initial={editing}
          options={options}
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
        <DateField
          label="Due date"
          required
          value={draft.dueDate}
          onChange={(dueDate) => update({ dueDate })}
          error={errors.dueDate}
        />
        <BrandField
          brands={options.brands}
          value={draft.brands}
          onChange={(brands) => update({ brands })}
          error={errors.brands}
        />
        <TextField
          label="Theme or concept"
          required
          maxLength={MAX_THEME}
          value={draft.themeConcept}
          onChangeText={(themeConcept) => update({ themeConcept })}
          error={errors.themeConcept}
        />
        <TextField
          label="Description"
          required
          multiline
          maxLength={MAX_DESCRIPTION}
          value={draft.description}
          onChangeText={(description) => update({ description })}
          error={errors.description}
        />
        <ItemsSection
          items={draft.items}
          error={errors.items}
          attempted={attempted}
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
                : `${failure.message} Check the request list before you send it again.`
            }
          />
        ) : null}
      </ScrollView>
      <ActionBar>
        {!online ? (
          <AppText variant="caption" tone="muted">
            {`You are offline. Connect to ${edit ? 'save' : 'submit'}.`}
          </AppText>
        ) : draft.items.length > 0 ? (
          <AppText variant="caption" tone="muted">
            {`${draft.items.length} ${draft.items.length === 1 ? 'item' : 'items'} · ${totalQty(draft)} pieces`}
          </AppText>
        ) : null}
        <View>
          <Button block loading={isPending} disabled={!online} onPress={submit}>
            {edit ? 'Save changes' : 'Submit request'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
