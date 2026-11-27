import { View } from 'react-native';

import { BarList, type BarItem } from './charts/bar-list';
import { donutSlices, formatShare, rankShares } from './charts/donut';
import { DonutChart } from './charts/donut-chart';
import { ReportCard } from './report-card';

/** Each branch's part of all sales: a ring of the largest, then every branch with its bar. */
export function BranchShares({ items }: { items: BarItem[] }) {
  const ranked = rankShares(items);
  const slices = donutSlices(ranked);

  return (
    <>
      {slices.length > 0 ? (
        <ReportCard title="Sales by branch" note="All groups together, largest first.">
          <DonutChart slices={slices} label="Share of sales by branch" />
        </ReportCard>
      ) : null}
      <View className="rounded-xl bg-surface p-4 shadow-card">
        <BarList items={ranked.map((item) => ({ ...item, note: formatShare(item.percentage) }))} />
      </View>
    </>
  );
}
