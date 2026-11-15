// Route paths this module owns. The matching files live in src/app/(app)/purchase-request/.
export const purchaseRequestRoutes = {
  list: '/purchase-request',
  create: '/purchase-request/new',
  detail: (uuid: string) => `/purchase-request/${uuid}`,
} as const;
