import type { ModuleManifest } from '@/shared/types/module';

/**
 * Where a push notification should take the user: the document route of the module named in
 * the payload, or null when the payload is incomplete or the module cannot open a document.
 */
export function resolveNotificationRoute(
  data: unknown,
  manifests: readonly ModuleManifest[],
): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const { module, doc_uuid: docUuid } = data as Record<string, unknown>;
  if (typeof module !== 'string' || typeof docUuid !== 'string' || docUuid === '') return null;

  const manifest = manifests.find((item) => item.id === module);
  return manifest?.detailRoute ? manifest.detailRoute(docUuid) : null;
}
