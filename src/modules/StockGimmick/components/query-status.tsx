import { toAppError } from '@/core/errors';
import { Button, EmptyState } from '@/shared/ui';

export interface QueryStatusProps {
  error: unknown;
  /** The query is waiting for a connection. */
  offline: boolean;
  onRetry: () => void;
}

/** What the detail screen shows while the stock row is not there: not found, an error, or offline. */
export function QueryStatus({ error, offline, onRetry }: QueryStatusProps) {
  const retry = (
    <Button variant="soft" onPress={onRetry}>
      Try again
    </Button>
  );

  // A row outside the user's scope answers 404 too, so the text does not say why.
  if (error && toAppError(error).code === 'not_found') {
    return (
      <EmptyState
        icon="box"
        title="Stock not found"
        description="It may have been removed, or it is not in your office."
      />
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="alert"
        title="Could not load stock"
        description={toAppError(error).message}>
        {retry}
      </EmptyState>
    );
  }
  if (offline) {
    return (
      <EmptyState
        icon="alert"
        title="You are offline"
        description="Check your connection and try again.">
        {retry}
      </EmptyState>
    );
  }
  return null;
}
