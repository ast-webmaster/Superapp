import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState, Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { draftFromDetail } from '../create/draft';
import { useSalesVisitationOptions } from '../hooks/use-options';
import { useSalesVisitation } from '../hooks/use-sales-visitation';
import type { SalesVisitationDetail, SalesVisitationOptions } from '../types';
import { SalesVisitationForm } from './sales-visitation-form';

/** The form for a visit, filled in with what the server holds. */
export function SalesVisitationEditScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const detail = useSalesVisitation(uuid);
  const options = useSalesVisitationOptions();

  if (!detail.data || !options.data) {
    const waiting = !detail.data ? detail : options;
    return (
      <Screen>
        <QueryStatus
          subject="the visit"
          error={waiting.error}
          offline={waiting.fetchStatus === 'paused'}
          onRetry={() => void waiting.refetch()}
        />
      </Screen>
    );
  }
  if (!detail.data.allowed_actions.includes('update')) {
    return (
      <Screen>
        <EmptyState
          icon="clipboard"
          title="This visit cannot be edited"
          description="Only the person who planned it can change it. Go back to see its status."
        />
      </Screen>
    );
  }
  return <EditForm detail={detail.data} options={options.data} />;
}

function EditForm({
  detail,
  options,
}: {
  detail: SalesVisitationDetail;
  options: SalesVisitationOptions;
}) {
  // Taken once: a later refetch of the detail must not replace what the user is editing.
  const [source] = useState(() => ({
    initial: draftFromDetail(detail),
    edit: { uuid: detail.uuid, resultOnly: detail.status !== 'PLANNED' },
  }));
  return <SalesVisitationForm options={options} {...source} />;
}
