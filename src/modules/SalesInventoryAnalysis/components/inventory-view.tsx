import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, Badge, Chip, EmptyState } from '@/shared/ui';
import { formatDateTime, formatMonth } from '@/shared/utils/format';

import type { Inventory, InventoryRow } from '../types';
import { formatMoh, formatNumber } from './number';
import { SectionTitle, Stat } from './section-title';
import { mohBadge } from './status';

const ALL = '';

function InventoryCard({
  row,
  months,
}: {
  row: InventoryRow;
  months: Inventory['periode']['bulan'];
}) {
  const badge = mohBadge(row.status, row.status_label);
  const sold = months.map((month) => `${month.label} ${formatNumber(row.sales[month.key] ?? 0)}`);

  return (
    <View
      accessible
      aria-label={`${row.group}, ${row.status_label}, stock ${formatNumber(row.stock_available)}, months on hand ${formatMoh(row.moh)}`}
      className="gap-3 rounded-xl border border-border bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="caption-strong" numberOfLines={2} className="min-w-0 shrink">
          {row.group}
        </AppText>
        <Badge size="sm" {...badge} />
      </View>
      <View className="flex-row gap-3">
        <Stat label="Stock" value={formatNumber(row.stock_available)} />
        <Stat label="Run rate / month" value={formatNumber(row.avg_run_rate)} />
        <Stat label="Months on hand" value={formatMoh(row.moh)} />
      </View>
      <AppText variant="caption" tone="muted">
        {`Sold: ${sold.join(' · ')}`}
      </AppText>
      <AppText variant="caption">{row.action}</AppText>
    </View>
  );
}

/** Stock available against the average run rate, one card per brand group. */
export function InventoryView({ data }: { data: Inventory }) {
  const [status, setStatus] = useState(ALL);
  const { bulan, months } = data.periode;
  const first = bulan[0];
  const last = bulan[bulan.length - 1];

  // One chip per status that has groups, with its count. The label is the one a row carries.
  const options = Object.entries(data.summary)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      key,
      label: `${data.rows.find((row) => row.status === key)?.status_label ?? key} ${count}`,
    }));
  const rows = status === ALL ? data.rows : data.rows.filter((row) => row.status === status);

  if (data.rows.length === 0) {
    return (
      <EmptyState
        icon="box"
        title="No stock data"
        description="Nothing to analyze for your branches and brands yet."
      />
    );
  }

  return (
    <>
      <View className="gap-1">
        <AppText variant="caption" tone="muted">
          {first && last
            ? `Run rate over ${months} months, ${formatMonth(first.key)} to ${formatMonth(last.key)}.`
            : `Run rate over ${months} months.`}
        </AppText>
        {data.meta.last_stock_updated_at ? (
          <AppText variant="caption" tone="muted">
            {`Stock as of ${formatDateTime(data.meta.last_stock_updated_at)}.`}
          </AppText>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        role="group"
        aria-label="Status"
        contentContainerClassName="gap-2">
        <Chip
          outlined
          label={`All ${data.rows.length}`}
          selected={status === ALL}
          onPress={() => setStatus(ALL)}
        />
        {options.map((option) => (
          <Chip
            outlined
            key={option.key}
            label={option.label}
            selected={status === option.key}
            onPress={() => setStatus(option.key)}
          />
        ))}
      </ScrollView>
      <SectionTitle title="Brand groups" />
      {rows.map((row) => (
        <InventoryCard key={row.group} row={row} months={bulan} />
      ))}
    </>
  );
}
