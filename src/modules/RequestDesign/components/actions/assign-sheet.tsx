import { useState } from 'react';
import { View } from 'react-native';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, Loading, Sheet, OptionRow } from '@/shared/ui';

import { useRequestDesignOptions } from '../../hooks/use-options';
import { failureOutcome } from '../write-outcome';
import type { ActionSheetProps } from './due-date-sheet';

/** The approver chooses which designer takes the request. It then counts as picked by them. */
export function AssignSheet({ detail, online, action, onClose }: ActionSheetProps) {
  const options = useRequestDesignOptions();
  const [email, setEmail] = useState<string | null>(null);

  const submit = () => {
    if (action.isPending || email === null) return;
    action.mutate(
      { action: 'assign', assignTo: email, updatedAt: detail.updated_at },
      { onSuccess: onClose },
    );
  };

  return (
    <Sheet
      visible
      fullHeight
      title="Assign a designer"
      onClose={onClose}
      footer={
        <Button
          block
          loading={action.isPending}
          disabled={!online || email === null}
          onPress={submit}>
          Assign
        </Button>
      }>
      {options.data === undefined ? (
        options.error ? (
          <>
            <Alert tone="danger" message={toAppError(options.error).message} />
            <Button variant="soft" onPress={() => void options.refetch()}>
              Try again
            </Button>
          </>
        ) : (
          <Loading label="Loading designers" />
        )
      ) : options.data.designers.length === 0 ? (
        <AppText tone="muted">There are no designers to assign.</AppText>
      ) : (
        <View className="gap-2 pb-2">
          {options.data.designers.map((designer) => {
            const selected = email === designer.email;
            return (
              <OptionRow
                key={designer.email}
                role="radio"
                aria-label={designer.name}
                label={designer.name}
                caption={designer.email === detail.picked_by ? 'Current designer' : designer.email}
                selected={selected}
                onPress={() => setEmail(designer.email)}
              />
            );
          })}
        </View>
      )}
      {action.error ? <Alert {...failureOutcome(action.error)} /> : null}
      {!online ? (
        <AppText variant="caption" tone="muted">
          Connect to the internet to assign a designer.
        </AppText>
      ) : null}
    </Sheet>
  );
}
