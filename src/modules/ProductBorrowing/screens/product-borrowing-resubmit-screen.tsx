import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { EmptyState, Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { draftFromDetail } from '../create/draft';
import { useBorrowingOptions } from '../hooks/use-lookups';
import { useProductBorrowing } from '../hooks/use-product-borrowing';
import type { ProductBorrowingDetail, ProductBorrowingOptions } from '../types';
import { ProductBorrowingForm } from './product-borrowing-form';

/** The form for a borrowing that was sent back, filled in with what the server holds. */
export function ProductBorrowingResubmitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useProductBorrowing(id);
  const options = useBorrowingOptions();

  if (!detail.data || !options.data) {
    const waiting = !detail.data ? detail : options;
    return (
      <Screen>
        <QueryStatus
          subject="the borrowing"
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
          title="This borrowing cannot be resubmitted"
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
  detail: ProductBorrowingDetail;
  options: ProductBorrowingOptions;
}) {
  // Taken once: a later refetch of the detail must not replace what the user is editing. The
  // `updated_at` is taken with it, since that is the version the form was filled from.
  const [source] = useState(() => ({
    initial: draftFromDetail(detail),
    resubmit: { uuid: detail.uuid, updatedAt: detail.updated_at },
  }));
  return <ProductBorrowingForm options={options} {...source} />;
}
