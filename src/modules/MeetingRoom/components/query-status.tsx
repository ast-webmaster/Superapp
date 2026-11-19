import { toAppError } from '@/core/errors';
import { Button, EmptyState, Loading } from '@/shared/ui';

export interface QueryStatusProps {
  /** What is being loaded, for the messages: "the rooms", "this booking". */
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
    const { code, message } = toAppError(error);
    if (code === 'not_found') {
      return (
        <EmptyState
          icon="calendar"
          title="Booking not found"
          description="It may have been removed, or you no longer have access to it."
        />
      );
    }
    if (code === 'forbidden') {
      return (
        <EmptyState
          icon="lock"
          title="No access to Meeting Room"
          description="Your account cannot book rooms, or your office is not set up for it. Ask an admin if you think this is wrong."
        />
      );
    }
    return (
      <EmptyState icon="alert" title={`Could not load ${subject}`} description={message}>
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
