import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/shared/theme/tokens';
import {
  AppText,
  BottomNav,
  ChipGroup,
  InfoCard,
  Logo,
  ModuleCard,
  TextField,
  useBottomNavInset,
  useToast,
} from '@/shared/ui';

import { navItems } from '../components/sample-data';

const departments = [
  { value: 'all', label: 'All', icon: 'home' },
  { value: 'sales', label: 'Sales', icon: 'chart' },
  { value: 'finance', label: 'Finance', icon: 'wallet' },
  { value: 'stock', label: 'Stock', icon: 'box' },
] as const;

/** The design system in context: how a department home screen is put together. */
export default function DemoScreen() {
  const { top } = useSafeAreaInsets();
  const bottomInset = useBottomNavInset();
  const { show } = useToast();
  const [tab, setTab] = useState<string>('home');
  const [favorite, setFavorite] = useState(true);

  const open = (title: string) => show({ tone: 'success', message: `${title} opened` });

  return (
    <View className="flex-1 items-center bg-surface-gray">
      <View className="w-full max-w-phone flex-1">
        <ScrollView
          contentContainerClassName="gap-4"
          contentContainerStyle={{ paddingBottom: bottomInset }}>
          {/* Inputs and unselected chips are surface-gray, so they need a white ground. */}
          <View
            className="gap-4 rounded-b-xl bg-surface px-5 pb-5"
            style={{ paddingTop: top + sizes.screenTopGap }}>
            <Logo width={136} className="py-2" />
            <AppText variant="heading">Your workspace</AppText>
            <TextField icon="search" placeholder="Search departments" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5 grow-0"
              contentContainerClassName="px-5">
              <ChipGroup
                label="Filter by department"
                options={departments}
                defaultValue="all"
                className="flex-nowrap"
              />
            </ScrollView>
          </View>
          <View className="gap-4 px-5">
            <InfoCard
              icon="clipboard"
              title="3 approvals waiting"
              description="Review requests from Sales and Finance."
              onPress={() => open('Approvals')}
            />
            <ModuleCard
              title="Stock opname"
              department="Warehouse, Jakarta DC"
              icon="box"
              badges={[
                { label: '12 pending', tone: 'warning' },
                { label: 'Approval', tone: 'info' },
              ]}
              meta="Updated 5m ago"
              favorite={favorite}
              onToggleFavorite={() => setFavorite((current) => !current)}
              onOpen={() => open('Stock opname')}
            />
            <ModuleCard
              title="Customer visit reports for the Greater Jakarta sales team this quarter"
              department="Sales, Jakarta"
              icon="truck"
              meta="Updated today"
              onOpen={() => open('Customer visit reports')}
            />
            <ModuleCard
              title="Payslip"
              department="Finance"
              icon="wallet"
              onOpen={() => open('Payslip')}
            />
            <ModuleCard loading />
          </View>
        </ScrollView>
        <BottomNav items={navItems} activeKey={tab} onChange={setTab} />
      </View>
    </View>
  );
}
