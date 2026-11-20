// Route paths this module owns. The matching files live in src/app/(app)/stock-gimmick/.
export const stockGimmickRoutes = {
  list: '/stock-gimmick',
  detail: (id: number | string) => `/stock-gimmick/${id}`,
} as const;
