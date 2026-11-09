import type { ModuleManifest } from '@/shared/types/module';

import { moveId } from './reorder';
import { useFavoriteAppsStore } from './favorite-apps-store';
import { useAvailableModules } from './use-available-modules';

/**
 * The apps the user pinned to Home, in their order, and the ones they have not. Only apps the
 * user may open appear: a favorite whose permission was taken away is hidden, not deleted.
 */
export function useFavoriteApps() {
  const available = useAvailableModules();
  const ready = useFavoriteAppsStore((state) => state.ready);
  const savedIds = useFavoriteAppsStore((state) => state.ids);
  const save = useFavoriteAppsStore((state) => state.save);

  const byId = new Map(available.map((manifest) => [manifest.id, manifest]));
  const ids = (savedIds ?? available.map((manifest) => manifest.id)).filter((id) => byId.has(id));
  const favorites = ids.map((id) => byId.get(id)!);
  const others: ModuleManifest[] = available.filter((manifest) => !ids.includes(manifest.id));

  return {
    ready,
    favorites,
    others,
    add: (id: string) => save([...ids, id]),
    remove: (id: string) => save(ids.filter((current) => current !== id)),
    move: (id: string, step: -1 | 1) => save(moveId(ids, id, step)),
  };
}
