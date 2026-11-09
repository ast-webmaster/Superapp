/**
 * Every React Query key of the inbox. `all` invalidates every list, including the one that
 * only exists to count the tab badge.
 */
export const inboxKeys = {
  all: ['inbox'] as const,
  list: (modules: readonly string[] | undefined, perPage: number) =>
    [...inboxKeys.all, 'list', modules?.join(',') ?? 'all', perPage] as const,
};
