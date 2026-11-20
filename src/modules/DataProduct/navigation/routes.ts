// Route paths this module owns. The matching files live in src/app/(app)/data-product/.
export const dataProductRoutes = {
  list: '/data-product',
  detail: (id: number | string) => `/data-product/${id}`,
} as const;
