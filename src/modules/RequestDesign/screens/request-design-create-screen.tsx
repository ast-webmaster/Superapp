import { Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { emptyDraft } from '../create/draft';
import { useRequestDesignOptions } from '../hooks/use-options';
import { RequestDesignForm } from './request-design-form';

/** A new request. The form waits for the brands and item choices it is built from. */
export function RequestDesignCreateScreen() {
  const options = useRequestDesignOptions();

  if (!options.data) {
    return (
      <Screen>
        <QueryStatus
          subject="the form"
          error={options.error}
          offline={options.fetchStatus === 'paused'}
          onRetry={() => void options.refetch()}
        />
      </Screen>
    );
  }
  return <RequestDesignForm options={options.data} initial={emptyDraft} />;
}
