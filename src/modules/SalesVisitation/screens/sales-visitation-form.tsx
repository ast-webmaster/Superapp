import { router, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { toAppError } from '@/core/errors';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { ActionBar, Alert, AppText, Button, Screen, TextField, useConfirm } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import { CustomerField } from '../components/form/customer-field';
import { DateField } from '../components/form/date-field';
import { LocationField } from '../components/form/location-field';
import { MultiPickField } from '../components/form/multi-pick-field';
import { isDirty, MAX_TITLE, submitFailureMessage, validateForm } from '../create/draft';
import { useSaveSalesVisitation } from '../hooks/use-save-sales-visitation';
import { salesVisitationRoutes } from '../navigation/routes';
import type { SalesVisitationDraft, SalesVisitationOptions } from '../types';

export interface SalesVisitationFormProps {
  options: SalesVisitationOptions;
  /** What the form starts with: empty for a new visit, the server's copy for an edit. */
  initial: SalesVisitationDraft;
  /**
   * Set to edit this visit. `resultOnly` is a visit already checked in or completed: the server
   * then accepts only the result, so the rest is shown as text.
   */
  edit?: { uuid: string; resultOnly: boolean };
}

/** One form behind both planning a visit and editing it. The draft is `useState`, lost on leaving. */
export function SalesVisitationForm({ options, initial, edit }: SalesVisitationFormProps) {
  const confirm = useConfirm();
  const online = useIsOnline();
  const { mutateAsync, isPending, error } = useSaveSalesVisitation(edit);
  const resultOnly = edit?.resultOnly ?? false;

  const [draft, setDraft] = useState<SalesVisitationDraft>(initial);
  // Errors stay hidden until the user tries to save, so a fresh form is not red.
  const [attempted, setAttempted] = useState(false);
  const [savedUuid, setSavedUuid] = useState<string | null>(null);

  const errors = attempted ? validateForm(draft, resultOnly) : {};
  const update = (patch: Partial<SalesVisitationDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  // Leaving with work in the form asks first. Once the server has saved it, nothing is lost.
  usePreventRemove(isDirty(draft, initial) && savedUuid === null, ({ repeat }) =>
    confirm({
      title: edit ? 'Discard your changes?' : 'Discard this visit?',
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
    // A new visit replaces the form; an edit goes back to the visit it was opened from.
    if (edit) router.dismissTo(salesVisitationRoutes.detail(savedUuid) as never);
    else router.replace(salesVisitationRoutes.detail(savedUuid) as never);
  }, [savedUuid, edit]);

  const submit = () => {
    if (Object.keys(validateForm(draft, resultOnly)).length > 0) {
      setAttempted(true);
      return;
    }
    confirm({
      title: edit ? 'Save your changes?' : 'Plan this visit?',
      confirmLabel: edit ? 'Save' : 'Plan visit',
      icon: 'clipboard',
      success: { title: edit ? 'Visit saved' : 'Visit planned' },
      onConfirm: () => {
        if (isPending) return;
        return mutateAsync(draft).then((detail) => setSavedUuid(detail.uuid));
      },
    });
  };

  const failure = error ? toAppError(error) : null;

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        {resultOnly ? (
          <View className="gap-1 rounded-xl border border-border bg-surface p-4">
            <AppText variant="caption-strong">{draft.title}</AppText>
            <AppText variant="label" tone="muted">
              {`${draft.unregistered ? draft.customerName : (draft.customer?.customer_name ?? '')} · ${draft.date ? formatDate(draft.date) : ''}`}
            </AppText>
            <AppText variant="label" tone="muted">
              The visit has started, so only the result can change.
            </AppText>
          </View>
        ) : (
          <>
            <CustomerField
              unregistered={draft.unregistered}
              customer={draft.customer}
              customerName={draft.customerName}
              onChange={update}
              error={errors.customer}
            />
            <TextField
              label="Title"
              required
              maxLength={MAX_TITLE}
              value={draft.title}
              onChangeText={(title) => update({ title })}
              error={errors.title}
            />
            <DateField
              label="Visit date"
              required
              value={draft.date}
              onChange={(date) => update({ date })}
              error={errors.date}
            />
            <LocationField
              value={draft.location}
              onChange={(location) => update({ location })}
              customerId={draft.unregistered ? null : (draft.customer?.customer_id ?? null)}
              error={errors.location}
            />
            <MultiPickField
              label="Purpose"
              placeholder="Choose the purposes"
              options={options.purposes.map((purpose) => ({
                value: String(purpose.id),
                label: purpose.name,
              }))}
              value={draft.purposeIds.map(String)}
              onChange={(values) => update({ purposeIds: values.map(Number) })}
              error={errors.purposes}
            />
            <MultiPickField
              label="Brand category"
              placeholder="Choose the brands"
              options={options.categories.map((category) => ({
                value: category.category_code,
                label: category.category_name,
              }))}
              value={draft.categoryCodes}
              onChange={(categoryCodes) => update({ categoryCodes })}
              error={errors.categories}
            />
            <TextField
              label="Plan"
              required
              multiline
              value={draft.plan}
              onChangeText={(plan) => update({ plan })}
              error={errors.plan}
            />
          </>
        )}
        {edit ? (
          <TextField
            label="Result"
            multiline
            help="What came out of the visit. You can write it after you check out."
            value={draft.result}
            onChangeText={(result) => update({ result })}
          />
        ) : null}
        {failure ? (
          <Alert
            tone={
              failure.code === 'validation' || failure.code === 'forbidden' ? 'danger' : 'warning'
            }
            message={
              failure.code === 'validation' || failure.code === 'forbidden'
                ? submitFailureMessage(failure)
                : `${failure.message} Check the visit list before you save again.`
            }
          />
        ) : null}
      </ScrollView>
      <ActionBar>
        {!online ? (
          <AppText variant="caption" tone="muted">
            {`You are offline. Connect to ${edit ? 'save' : 'plan the visit'}.`}
          </AppText>
        ) : null}
        <View>
          <Button block loading={isPending} disabled={!online} onPress={submit}>
            {edit ? 'Save changes' : 'Plan visit'}
          </Button>
        </View>
      </ActionBar>
    </Screen>
  );
}
