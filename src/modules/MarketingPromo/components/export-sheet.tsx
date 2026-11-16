import { useState } from 'react';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, DateRangePicker, Sheet, type DateRange } from '@/shared/ui';

import { useExportMarketingPromos } from '../hooks/use-export-marketing-promos';
import type { MarketingPromoKind } from '../types';

/** The server refuses longer ranges too (31 days with both ends counted). */
const MAX_DAYS = 31;

export interface ExportSheetProps {
  kind: MarketingPromoKind;
  visible: boolean;
  onClose: () => void;
}

function summary({ from, to }: DateRange) {
  if (from === null) return `Tap a start date, then an end date. Up to ${MAX_DAYS} days.`;
  if (to === null) return `From ${from}. Now tap the end date.`;
  return from === to ? from : `${from} to ${to}`;
}

export function ExportSheet({ kind, visible, onClose }: ExportSheetProps) {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const { mutate, isPending, error, reset } = useExportMarketingPromos(kind);

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Export to Excel"
      onClose={close}
      footer={
        <Button
          block
          iconLeft="download"
          loading={isPending}
          disabled={range.from === null || range.to === null}
          onPress={() => {
            if (range.from === null || range.to === null) return;
            mutate({ dateFrom: range.from, dateTo: range.to }, { onSuccess: close });
          }}>
          Download Excel
        </Button>
      }>
      <DateRangePicker value={range} onChange={setRange} maxDays={MAX_DAYS} />
      <AppText variant="caption" tone="muted" aria-live="polite">
        {summary(range)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {`Exports the ${kind === 'combination' ? 'Combination' : 'Single'} promos you can see, by promo date. Drafts are not included.`}
      </AppText>
      {error ? <Alert tone="danger" message={toAppError(error).message} /> : null}
    </Sheet>
  );
}
