// Route paths this module owns. The matching files live in src/app/(app)/on-duty-request/.
export const onDutyRequestRoutes = {
  list: '/on-duty-request',
  create: '/on-duty-request/new',
  detail: (uuid: string) => `/on-duty-request/${uuid}`,
  resubmit: (uuid: string) => `/on-duty-request/resubmit/${uuid}`,
  declaration: (uuid: string) => `/on-duty-request/declaration/${uuid}`,
} as const;
