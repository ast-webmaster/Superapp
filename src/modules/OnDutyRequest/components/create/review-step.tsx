import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, IconButton } from '@/shared/ui';
import { formatDate, formatMoney } from '@/shared/utils/format';

import {
  allowanceTotal,
  costAmount,
  costTotal,
  destinationDays,
  type StepKey,
} from '../../create/draft';
import type { BrandOption, OnDutyRequestDraft } from '../../types';
import { tripTypeLabel } from '../status';
import { costName } from './costs-step';
import { destinationSummary } from './destinations-step';
import { formatFileSize } from './file-size';

function Section({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="title" role="heading">
          {title}
        </AppText>
        <IconButton size="sm" icon="pencil" label={editLabel} onPress={onEdit} />
      </View>
      <View className="gap-3 rounded-xl border border-border bg-surface p-4">{children}</View>
    </View>
  );
}

/** A label over its value, so a long purpose wraps instead of being cut off. */
function Pair({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="body-strong">{value}</AppText>
    </View>
  );
}

export interface ReviewStepProps {
  draft: OnDutyRequestDraft;
  brands: BrandOption[];
  requester: string;
  today: string;
  /** Allowance per day for the trip type, or null when there is none. */
  rate: number | null;
  /** On a resubmit, no new letter means the one on the server stays. */
  keepsLetter: boolean;
  onEdit: (step: StepKey) => void;
}

export function ReviewStep({
  draft,
  brands,
  requester,
  today,
  rate,
  keepsLetter,
  onEdit,
}: ReviewStepProps) {
  const brandName = (code: string) =>
    brands.find((brand) => brand.category_code === code)?.category_name ?? code;
  const allowance = allowanceTotal(draft, rate);
  const sharing = draft.brands.flatMap((code) => {
    const percentage = draft.sharing[code]?.trim();
    return percentage ? [`${brandName(code)} ${percentage}%`] : [];
  });

  return (
    <>
      <Section title="Details" editLabel="Edit details" onEdit={() => onEdit('details')}>
        <Pair label="Date" value={formatDate(today)} />
        <Pair label="Requested by" value={requester} />
        <Pair label="Trip type" value={tripTypeLabel(draft.type) ?? ''} />
        <Pair label="Purpose" value={draft.purpose.trim()} />
        <Pair label="Remarks" value={draft.remarks.trim()} />
        <Pair label="Brands" value={draft.brands.map(brandName).join(', ')} />
        {sharing.length > 0 ? <Pair label="Cost sharing" value={sharing.join(', ')} /> : null}
        <Pair
          label="Letter of assignment"
          value={draft.letter?.name ?? (keepsLetter ? 'The letter you sent before' : '')}
        />
      </Section>

      <Section
        title={`Destinations (${draft.destinations.length})`}
        editLabel="Edit destinations"
        onEdit={() => onEdit('destinations')}>
        {draft.destinations.map((row) => (
          <View key={row.id} className="gap-1">
            <View className="flex-row items-start justify-between gap-3">
              <AppText variant="body-strong" className="min-w-0 flex-1">
                {row.destination ?? ''}
              </AppText>
              {rate !== null ? (
                <AppText variant="body-strong">{formatMoney(destinationDays(row) * rate)}</AppText>
              ) : null}
            </View>
            <AppText variant="caption" tone="muted">
              {destinationSummary(row)}
            </AppText>
          </View>
        ))}
      </Section>

      <Section
        title={`Costs (${draft.costs.length})`}
        editLabel="Edit costs"
        onEdit={() => onEdit('costs')}>
        {draft.costs.map((cost) => (
          <View key={cost.id} className="flex-row items-start justify-between gap-3">
            <AppText variant="body-strong" className="min-w-0 flex-1">
              {costName(cost)}
            </AppText>
            <AppText variant="body-strong">{formatMoney(costAmount(cost))}</AppText>
          </View>
        ))}
        <View className="gap-2 border-t border-border pt-3">
          <View className="flex-row items-center justify-between gap-3">
            <AppText variant="caption" tone="muted">
              Costs
            </AppText>
            <AppText variant="caption">{formatMoney(costTotal(draft))}</AppText>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <AppText variant="caption" tone="muted">
              Allowance
            </AppText>
            <AppText variant="caption">{formatMoney(allowance)}</AppText>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <AppText variant="body-strong">Total (estimate)</AppText>
            <AppText variant="title">{formatMoney(costTotal(draft) + allowance)}</AppText>
          </View>
          <AppText variant="caption" tone="muted">
            The server works out the final allowance and total when it saves.
          </AppText>
        </View>
      </Section>

      <Section
        title={`Attachments (${draft.attachments.length})`}
        editLabel="Edit attachments"
        onEdit={() => onEdit('attachments')}>
        {draft.attachments.length === 0 ? (
          <AppText tone="muted">No files attached.</AppText>
        ) : (
          draft.attachments.map(({ id, description, file }) => (
            <View key={id} className="gap-1">
              <AppText variant="body-strong">{description.trim()}</AppText>
              <AppText variant="caption" tone="muted">
                {file.size !== null ? `${file.name} · ${formatFileSize(file.size)}` : file.name}
              </AppText>
            </View>
          ))
        )}
      </Section>
    </>
  );
}
