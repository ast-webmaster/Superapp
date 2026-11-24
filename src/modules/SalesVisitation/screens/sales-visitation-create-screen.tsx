import { Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { emptyDraft } from '../create/draft';
import { useSalesVisitationOptions } from '../hooks/use-options';
import { SalesVisitationForm } from './sales-visitation-form';

/** A new visit. The form waits for the purposes and brands it is built from. */
export function SalesVisitationCreateScreen() {
  const options = useSalesVisitationOptions();

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
  return <SalesVisitationForm options={options.data} initial={emptyDraft} />;
}
