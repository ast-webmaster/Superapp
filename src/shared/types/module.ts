import type { IconName } from '@/shared/ui';

/** What a business module tells the app shell about itself. */
export type ModuleManifest = {
  id: string;
  title: string;
  description: string;
  /**
   * Entry route path, e.g. "/price-approval". A plain string on purpose: the module owns
   * its path, but the typed route tree belongs to the app shell, which casts when linking.
   */
  route: string;
  /**
   * Other module slugs the backend notifies with for this module, besides `id`. Inbox items
   * and push notifications carrying one of them open this module.
   */
  aliases?: readonly string[];
  /**
   * Path of one document, so an inbox item can open it. `docUuid` is the document's uuid and
   * `slug` the module slug the notification carried (`id` or one of `aliases`).
   */
  detailRoute?: (docUuid: string, slug: string) => string;
  /** Tile icon on the home screen. Falls back to a generic box. */
  icon?: IconName;
  /** Hidden from users who hold none of these permissions. Omit when everyone may open it. */
  permission?: string | readonly string[];
};
