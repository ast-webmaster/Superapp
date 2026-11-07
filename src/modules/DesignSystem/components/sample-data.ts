import type { BottomNavProps } from '@/shared/ui';

export const navItems = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'apps', label: 'Apps', icon: 'grid' },
  { key: 'inbox', label: 'Inbox', icon: 'bell' },
  { key: 'profile', label: 'Profile', icon: 'user' },
] as const satisfies BottomNavProps['items'];
