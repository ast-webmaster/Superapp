// Route paths this module owns. The matching files live in src/app/(app)/register-customer/.
export const registerCustomerRoutes = {
  list: '/register-customer',
  create: '/register-customer/new',
  detail: (uuid: string) => `/register-customer/${uuid}`,
} as const;
