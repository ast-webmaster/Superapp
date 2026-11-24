// Route paths this module owns. The matching files live in src/app/(app)/sales-visitation/.
export const salesVisitationRoutes = {
  list: '/sales-visitation',
  create: '/sales-visitation/new',
  detail: (uuid: string) => `/sales-visitation/${uuid}`,
  edit: (uuid: string) => `/sales-visitation/edit/${uuid}`,
  checkIn: (uuid: string) => `/sales-visitation/check-in/${uuid}`,
  checkOut: (uuid: string) => `/sales-visitation/check-out/${uuid}`,
} as const;
