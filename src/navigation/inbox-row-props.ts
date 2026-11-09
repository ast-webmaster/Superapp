import { router, type Href } from 'expo-router';

import type { InboxItem, InboxRowProps } from '@/modules/Inbox';

import { moduleManifests } from './registry';

/** The module's icon, and what tapping a row does: open the document in its module, or the module. */
export function inboxRowProps(item: InboxItem): Pick<InboxRowProps, 'icon' | 'onPress'> {
  const manifest = moduleManifests.find((candidate) => candidate.id === item.module);
  if (!manifest) return {};
  const route =
    item.doc_uuid && manifest.detailRoute ? manifest.detailRoute(item.doc_uuid) : manifest.route;
  return { icon: manifest.icon, onPress: () => router.push(route as Href) };
}
