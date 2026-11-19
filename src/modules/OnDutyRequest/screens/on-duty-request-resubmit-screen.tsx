import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState, Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { draftFromDetail } from '../create/draft';
import { useOnDutyOptions } from '../hooks/use-lookups';
import { useOnDutyRequest } from '../hooks/use-on-duty-request';
import type { OnDutyOptions, OnDutyRequestDetail } from '../types';
import { OnDutyRequestForm } from './on-duty-request-form';

/** The form for a request that was sent back, filled in with what the server holds. */
export function OnDutyRequestResubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useOnDutyRequest(id);
  const options = useOnDutyOptions();

  if (!detail.data || !options.data) {
    const waiting = !detail.data ? detail : options;
    return (
      <Screen>
        <QueryStatus
          subject="the request"
          error={waiting.error}
          offline={waiting.fetchStatus === 'paused'}
          onRetry={() => void waiting.refetch()}
        />
      </Screen>
    );
  }
  if (!detail.data.can_resubmit) {
    return (
      <Screen>
        <EmptyState
          icon="clipboard"
          title="This request cannot be resubmitted"
          description="It is no longer waiting for your changes. Go back to see its status."
        />
      </Screen>
    );
  }
  return <ResubmitForm detail={detail.data} options={options.data} />;
}

function ResubmitForm({
  detail,
  options,
}: {
  detail: OnDutyRequestDetail;
  options: OnDutyOptions;
}) {
  // Taken once: a later refetch of the detail must not replace what the user is editing.
  const [initial] = useState(() => draftFromDetail(detail));
  return <OnDutyRequestForm options={options} initial={initial} resubmitUuid={detail.uuid} />;
}
