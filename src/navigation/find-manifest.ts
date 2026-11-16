import type { ModuleManifest } from '@/shared/types/module';

/** The module a notification slug belongs to: a manifest `id` or one of its `aliases`. */
export function findManifest(
  manifests: readonly ModuleManifest[],
  slug: string,
): ModuleManifest | undefined {
  return manifests.find((manifest) => manifest.id === slug || manifest.aliases?.includes(slug));
}
