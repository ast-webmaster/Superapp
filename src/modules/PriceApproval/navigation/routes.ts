// Route paths this module owns. The matching files live in src/app/(app)/price-approval/.
export const priceApprovalRoutes = {
  list: '/price-approval',
  detail: (uuid: string) => `/price-approval/${uuid}`,
} as const;
