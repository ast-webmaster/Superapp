import { useCan } from '@/core/permissions';

import { moduleManifests } from './registry';

/** Modules the signed-in user is allowed to open. */
export function useAvailableModules() {
  const can = useCan();
  return moduleManifests.filter((manifest) => can(manifest.permission));
}
