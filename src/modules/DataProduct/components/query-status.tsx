import { toAppError } from '@/core/errors';
import { Button, EmptyState } from '@/shared/ui';

export interface QueryStatusProps {
  error: unknown;
  /** The query is waiting for a connection. */
  offline: boolean;
  onRetry: () => void;
}

/** What the detail screen shows while the product is not there: not found, an error, or offline. */
export function QueryStatus({ error, offline, onRetry }: QueryStatusProps) {
  const retry = (
    <Button variant="soft" onPress={onRetry}>
      Try again
    </Button>
  );

  if (error && toAppError(error).code === 'not_found') {
    return (
      <EmptyState
        icon="box"
        title="Product not found"
        description="It may have been removed from the product list."
      />
    );
  }
  if (error) {
    return (
      <EmptyState
        icon="alert"
        title="Could not load product"
        description={toAppError(error).message}>
        {retry}
      </EmptyState>
    );
  }
  return (
    <EmptyState
      icon="alert"
      title="You are offline"
      description="Check your connection and try again.">
      {retry}
    </EmptyState>
  );
}
