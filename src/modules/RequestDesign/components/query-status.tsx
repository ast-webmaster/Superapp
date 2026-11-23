import { toAppError } from '@/core/errors';
import { Button, EmptyState, Loading } from '@/shared/ui';

export interface QueryStatusProps {
  /** What is being loaded, for the messages: "the form", "this request". */
  subject: string;
  error: unknown;
  /** The query is waiting for a connection. */
  offline: boolean;
  onRetry: () => void;
}

/** What a screen shows while its data is not there yet: an error, an offline notice, or a spinner. */
export function QueryStatus({ subject, error, offline, onRetry }: QueryStatusProps) {
  const retry = (
    <Button variant="soft" onPress={onRetry}>
      Try again
    </Button>
  );

  if (error) {
    const failure = toAppError(error);
    if (failure.code === 'not_found') {
      return (
        <EmptyState
          icon="clipboard"
          title="Request not found"
          description="It may have been removed, or you no longer have access to it."
        />
      );
    }
    if (failure.code === 'forbidden') {
      return (
        <EmptyState
          icon="lock"
          title="No access"
          description="Your account cannot open this. Ask an administrator if you need it."
        />
      );
    }
    return (
      <EmptyState icon="alert" title={`Could not load ${subject}`} description={failure.message}>
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
  return <Loading label={`Loading ${subject}`} />;
}
