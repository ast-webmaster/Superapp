// Route paths this module owns. The matching files live in src/app/(app)/data-customer/.
export const dataCustomerRoutes = {
  list: '/data-customer',
  detail: (id: number | string) => `/data-customer/${id}`,
} as const;
