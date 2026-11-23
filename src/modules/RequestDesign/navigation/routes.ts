// Route paths this module owns. The matching files live in src/app/(app)/request-design/.
export const requestDesignRoutes = {
  list: '/request-design',
  create: '/request-design/new',
  detail: (uuid: string) => `/request-design/${uuid}`,
  analytics: '/request-design/analytics',
  edit: (uuid: string) => `/request-design/edit/${uuid}`,
} as const;
