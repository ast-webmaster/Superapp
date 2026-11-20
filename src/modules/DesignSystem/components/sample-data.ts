import type { BottomNavProps } from '@/shared/ui';

export const navItems = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'apps', label: 'Apps', icon: 'grid' },
  { key: 'ai-chat', label: 'AI chat', icon: 'ai' },
  { key: 'inbox', label: 'Inbox', icon: 'bell' },
] as const satisfies BottomNavProps['items'];
