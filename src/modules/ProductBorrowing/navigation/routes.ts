// Route paths this module owns. The matching files live in src/app/(app)/product-borrowing/.
export const productBorrowingRoutes = {
  list: '/product-borrowing',
  create: '/product-borrowing/new',
  detail: (uuid: string) => `/product-borrowing/${uuid}`,
  resubmit: (uuid: string) => `/product-borrowing/resubmit/${uuid}`,
} as const;
