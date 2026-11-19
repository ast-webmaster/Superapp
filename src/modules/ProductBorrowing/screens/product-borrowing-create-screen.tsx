import { Screen } from '@/shared/ui';

import { QueryStatus } from '../components/query-status';
import { emptyDraft } from '../create/draft';
import { useBorrowingOptions } from '../hooks/use-lookups';
import { ProductBorrowingForm } from './product-borrowing-form';

export function ProductBorrowingCreateScreen() {
  const { data: options, error, fetchStatus, refetch } = useBorrowingOptions();

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
  return <ProductBorrowingForm options={options} initial={emptyDraft} />;
}
