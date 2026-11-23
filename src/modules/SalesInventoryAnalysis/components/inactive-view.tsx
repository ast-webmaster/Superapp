import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Badge, EmptyState, focusRing, Icon } from '@/shared/ui';
import { formatDate } from '@/shared/utils/format';

import type { InactiveBranch, InactiveDealer, InactiveDealers } from '../types';
import { formatNumber } from './number';
import { SectionTitle } from './section-title';

function DealerCard({ dealer }: { dealer: InactiveDealer }) {
  return (
    <View className="gap-3 rounded-lg bg-surface-gray p-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 shrink gap-1">
          <AppText variant="body-strong" numberOfLines={2}>
            {dealer.customer_name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {[dealer.customer_code, dealer.customer_city].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <Badge
          size="sm"
          tone="warning"
          label={`${formatNumber(dealer.max_hari_tanpa_transaksi)} days`}
        />
      </View>
      {dealer.items.map((item) => (
        <View key={item.group} className="gap-1">
          <AppText variant="caption-strong">{item.group}</AppText>
          <AppText variant="caption" tone="muted">
            {`Last order ${formatDate(item.last_posting_date)}, ${formatNumber(item.hari_tanpa_transaksi)} days ago · limit ${item.batas_label} · ${formatNumber(item.jumlah_transaksi)} orders in all`}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function BranchCard({ branch, initiallyOpen }: { branch: InactiveBranch; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View className="rounded-xl border border-border bg-surface">
      <Pressable
        role="button"
        aria-expanded={open}
        aria-label={`${branch.branch}, ${branch.dealer_count} dealers`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        className={clsx(
          'min-h-control flex-row items-center justify-between gap-3 rounded-xl p-4 active:bg-surface-gray',
          focusRing,
        )}>
        <View className="min-w-0 shrink gap-1">
          <AppText variant="module-title" numberOfLines={1}>
            {branch.branch}
          </AppText>
          <AppText variant="caption" tone="muted">
            {`${formatNumber(branch.dealer_count)} dealers`}
          </AppText>
        </View>
        <Icon name={open ? 'minus' : 'plus'} />
      </Pressable>
      {/* Only an open branch is drawn: a scope with hundreds of dealers stays light. */}
      {open ? (
        <View className="gap-3 px-4 pb-4">
          {branch.dealers.map((dealer) => (
            <DealerCard key={`${dealer.branch}-${dealer.customer_code}`} dealer={dealer} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Dealers that bought a brand group before but have been silent longer than that group allows. */
export function InactiveView({ data }: { data: InactiveDealers }) {
  if (data.groups.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No transaction limit set"
        description="No brand group has a limit yet, so no dealer can be flagged. A limit is set in Wall Report, Group, on the web."
      />
    );
  }
  if (data.branches.length === 0) {
    return (
      <EmptyState
        icon="check"
        title="No inactive dealers"
        description="Every dealer has ordered within the limit of its brand group."
      />
    );
  }

  return (
    <>
      <AppText variant="caption" tone="muted">
        {`As of ${formatDate(data.acuan.tanggal)}. A dealer is listed when its last order of a brand group is older than that group's limit.`}
      </AppText>
      <View className="gap-1 rounded-xl border border-border bg-surface p-4">
        <AppText variant="module-title">
          {`${formatNumber(data.summary.dealers)} dealers in ${formatNumber(data.summary.branches)} branches`}
        </AppText>
        <AppText variant="caption" tone="muted">
          {`Limits: ${data.groups.map((group) => `${group.group} ${group.batas_label}`).join(', ')}`}
        </AppText>
      </View>
      <SectionTitle title="Branches" />
      {data.branches.map((branch) => (
        <BranchCard
          key={branch.branch}
          branch={branch}
          initiallyOpen={data.branches.length === 1}
        />
      ))}
    </>
  );
}
