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
  /** Hidden from users who hold none of these permissions. Omit when everyone may open it. */
  permission?: string | readonly string[];
};
