import { router, usePathname, type Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';

import { BottomNav } from '@/shared/ui';

import { useInboxCount } from './use-inbox-count';

// On Windows, Expo's typed-routes generator keeps "/index" on nested index routes, so the
// generated Href union has no "/" even though the route exists. Cast to Href to link it.
const tabs = [
  { key: 'home', label: 'Home', icon: 'home', href: '/' },
  { key: 'apps', label: 'Apps', icon: 'grid', href: '/apps' },
  { key: 'inbox', label: 'Inbox', icon: 'bell', href: '/inbox' },
  { key: 'ai-chat', label: 'AI chat', icon: 'chat', href: '/ai-chat' },
] as const;

export default function AppTabs() {
  const pathname = usePathname();
  const inboxCount = useInboxCount();
  const active = tabs.find((tab) => tab.href !== '/' && pathname.startsWith(tab.href)) ?? tabs[0];

  const [home, apps, inbox, aiChat] = tabs;
  const items = [home, apps, { ...inbox, badge: inboxCount }, aiChat] as const;

  return (
    <Tabs>
      <TabSlot />
      {/* The triggers only register the routes; BottomNav is the visible bar. */}
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="home" href={home.href as Href} />
        <TabTrigger name="apps" href={apps.href as Href} />
        <TabTrigger name="inbox" href={inbox.href as Href} />
        <TabTrigger name="ai-chat" href={aiChat.href as Href} />
      </TabList>
      <View pointerEvents="box-none" className="absolute inset-0 items-center">
        <View pointerEvents="box-none" className="w-full max-w-phone flex-1">
          <BottomNav
            items={items}
            activeKey={active.key}
            onChange={(key) => router.navigate(tabs.find((tab) => tab.key === key)!.href as Href)}
          />
        </View>
      </View>
    </Tabs>
  );
}
