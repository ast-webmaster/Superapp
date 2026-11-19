import { Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { emptyDraft } from '../create/draft';
import { useOnDutyOptions } from '../hooks/use-lookups';
import { OnDutyRequestForm } from './on-duty-request-form';

export function OnDutyRequestCreateScreen() {
  const { data: options, error, fetchStatus, refetch } = useOnDutyOptions();

  if (!options) {
    return (
      <Screen>
        <QueryStatus
          subject="the form"
          error={error}
          offline={fetchStatus === 'paused'}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }
  return <OnDutyRequestForm options={options} initial={emptyDraft} />;
}
