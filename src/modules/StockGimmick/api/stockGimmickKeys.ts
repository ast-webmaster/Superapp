/** Every React Query key of this module. The first segment is the manifest id. */
export const stockGimmickKeys = {
  all: ['stock-gimmick'] as const,
  lists: () => [...stockGimmickKeys.all, 'list'] as const,
  list: (search: string) => [...stockGimmickKeys.lists(), search] as const,
  details: () => [...stockGimmickKeys.all, 'detail'] as const,
  detail: (id: string) => [...stockGimmickKeys.details(), id] as const,
  movements: (id: string) => [...stockGimmickKeys.all, 'movements', id] as const,
};
