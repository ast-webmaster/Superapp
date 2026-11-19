import type { ModuleManifest } from '@/shared/types/module';

import { onDutyRequestRoutes } from './navigation/routes';

export const onDutyRequestManifest: ModuleManifest = {
  id: 'on-duty-request',
  title: 'On Duty Request',
  description: 'Request business trips and approve them',
  route: onDutyRequestRoutes.list,
  detailRoute: onDutyRequestRoutes.detail,
  icon: 'map',
  // The API answers 403 without one of these (the same list the web pages use); hide the entry
  // instead of opening an error screen.
  permission: [
    'create_on_duty_request',
    'readonly_all_on_duty_request',
    'read_on_duty_request',
    'update_on_duty_request',
    'delete_on_duty_request',
    'approve_on_duty_request_as_hrga',
    'approve_on_duty_request_as_finance',
  ],
};
