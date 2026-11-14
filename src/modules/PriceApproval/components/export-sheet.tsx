import { useState } from 'react';

import { toAppError } from '@/core/errors';
import { Alert, AppText, Button, DateRangePicker, Sheet, type DateRange } from '@/shared/ui';

import { useExportPriceApprovals } from '../hooks/use-export-price-approvals';

/** The server refuses longer ranges too (see the export request). */
const MAX_DAYS = 30;

export interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
}

function summary({ from, to }: DateRange) {
  if (from === null) return `Tap a start date, then an end date. Up to ${MAX_DAYS} days.`;
  if (to === null) return `From ${from}. Now tap the end date.`;
  return from === to ? from : `${from} to ${to}`;
}

export function ExportSheet({ visible, onClose }: ExportSheetProps) {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const { mutate, isPending, error, reset } = useExportPriceApprovals();

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
      {error ? <Alert tone="danger" message={toAppError(error).message} /> : null}
    </Sheet>
  );
}
