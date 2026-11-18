import { useState } from 'react';

import { Button, Sheet, TextField } from '@/shared/ui';

/** Matches the server's `max:191` on the customer code. */
const MAX_LENGTH = 191;

export interface CustomerCodeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the trimmed code. The server refuses a code that master data already uses. */
  onSubmit: (customerCode: string) => void;
}

/**
 * Finance gives the new customer its code when it approves, so that approval asks for one before
 * it is sent. Each time the sheet opens it starts empty.
 */
export function CustomerCodeSheet({ visible, onClose, onSubmit }: CustomerCodeSheetProps) {
  const [code, setCode] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);

  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCode('');
      setAttempted(false);
    }
  }

  const trimmed = code.trim();
  const error = attempted && trimmed === '' ? 'Enter the customer code.' : undefined;

  return (
    <Sheet
      visible={visible}
      title="Approve registration"
      onClose={onClose}
      footer={
        <Button
          block
          iconLeft="check"
          onPress={() => {
            if (trimmed === '') {
              setAttempted(true);
              return;
            }
            onSubmit(trimmed);
          }}>
          Approve
        </Button>
      }>
      <TextField
        label="Customer code"
        required
        value={code}
        onChangeText={setCode}
        maxLength={MAX_LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        help="The code the new customer gets in the master data. It must not be in use yet."
        error={error}
      />
    </Sheet>
  );
}
