import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState, Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { draftFromDetail } from '../create/draft';
import { useRequestDesignOptions } from '../hooks/use-options';
import { useRequestDesign } from '../hooks/use-request-design';
import type { RequestDesignDetail, RequestDesignOptions } from '../types';
import { RequestDesignForm } from './request-design-form';

/** The form for a request still waiting to be picked, filled in with what the server holds. */
export function RequestDesignEditScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const detail = useRequestDesign(uuid);
  const options = useRequestDesignOptions();

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
  if (!detail.data.allowed_actions.includes('edit')) {
    return (
      <Screen>
        <EmptyState
          icon="clipboard"
          title="This request cannot be edited"
          description="A designer may have picked it up already. Go back to see its status."
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
  detail: RequestDesignDetail;
  options: RequestDesignOptions;
}) {
  // Taken once: a later refetch of the detail must not replace what the user is editing. The
  // `updated_at` is taken with it, since that is the version the form was filled from.
  const [source] = useState(() => ({
    initial: draftFromDetail(detail),
    edit: { uuid: detail.uuid, updatedAt: detail.updated_at },
  }));
  return <RequestDesignForm options={options} {...source} />;
}
