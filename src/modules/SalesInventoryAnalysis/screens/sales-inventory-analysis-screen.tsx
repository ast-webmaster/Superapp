import { useState, type JSX } from 'react';
import { View } from 'react-native';

import { Chip, ListToolbar, Screen } from '@/shared/ui';

import { ActivityView } from '../components/activity-view';
import { FilterSheet } from '../components/filter-sheet';
import { InactiveView } from '../components/inactive-view';
import { InventoryView } from '../components/inventory-view';
import { QueryView } from '../components/query-view';
import { TargetView } from '../components/target-view';
import {
  useAchievement,
  useDealerActivity,
  useInactiveDealers,
  useInventory,
} from '../hooks/use-analysis';
import { useSalesInventoryAnalysisFilter } from '../store/salesInventoryAnalysisFilterStore';

const VIEWS = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'target', label: 'Target' },
  { key: 'activity', label: 'Activity' },
  { key: 'inactive', label: 'Inactive dealers' },
] as const;

type ViewKey = (typeof VIEWS)[number]['key'];

// One component per view, so only the open view runs its query.
function InventoryTab() {
  return (
    <QueryView query={useInventory()} subject="inventory">
      {(data) => <InventoryView data={data} />}
    </QueryView>
  );
}

function TargetTab() {
  return (
    <QueryView query={useAchievement()} subject="achievement">
      {(data) => <TargetView data={data} />}
    </QueryView>
  );
}

function ActivityTab() {
  return (
    <QueryView query={useDealerActivity()} subject="dealer activity">
      {(data) => <ActivityView data={data} />}
    </QueryView>
  );
}

function InactiveTab() {
  return (
    <QueryView query={useInactiveDealers()} subject="inactive dealers">
      {(data) => <InactiveView data={data} />}
    </QueryView>
  );
}

const TABS: Record<ViewKey, () => JSX.Element> = {
  inventory: InventoryTab,
  target: TargetTab,
  activity: ActivityTab,
  inactive: InactiveTab,
};

export function SalesInventoryAnalysisScreen() {
  const [view, setView] = useState<ViewKey>('inventory');
  const [filtering, setFiltering] = useState(false);
  const branchCount = useSalesInventoryAnalysisFilter((state) => state.branch.length);
  const brandCount = useSalesInventoryAnalysisFilter((state) => state.brand.length);
  const Tab = TABS[view];

  return (
    <Screen>
      <FilterSheet visible={filtering} onClose={() => setFiltering(false)} />
      <View className="pb-4 pt-2">
        <ListToolbar
          onFilter={() => setFiltering(true)}
          filterCount={(branchCount > 0 ? 1 : 0) + (brandCount > 0 ? 1 : 0)}>
          {VIEWS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={view === item.key}
              onPress={() => setView(item.key)}
            />
          ))}
        </ListToolbar>
      </View>
      <Tab />
    </Screen>
  );
}
