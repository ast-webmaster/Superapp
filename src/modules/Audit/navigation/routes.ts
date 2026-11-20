// Route paths this module owns. The matching files live in src/app/(app)/audit/.
export const auditRoutes = {
  list: '/audit',
  detail: (uuid: string) => `/audit/${uuid}`,
} as const;
