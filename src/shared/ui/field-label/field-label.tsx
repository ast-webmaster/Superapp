import type { ReactNode } from 'react';

import { AppText } from '../text/text';

export interface FieldLabelProps {
  children: ReactNode;
  /** Adds a red asterisk. Optional fields get no mark and no "(optional)" text. */
  required?: boolean;
}

/** The label above a form field. Every field component draws its label with this. */
export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return (
    <AppText variant="label">
      {children}
      {required ? (
        <AppText variant="label" tone="danger" aria-hidden>
          {' *'}
        </AppText>
      ) : null}
    </AppText>
  );
}
