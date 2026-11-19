import type { ModuleManifest } from '@/shared/types/module';

import { meetingRoomRoutes } from './navigation/routes';

export const meetingRoomManifest: ModuleManifest = {
  id: 'meeting-room',
  title: 'Meeting Room',
  description: 'See which rooms are free and book one',
  route: meetingRoomRoutes.list,
  icon: 'calendar',
  // The API answers 403 without it (the web page asks for the same, and only some offices may
  // book); hide the entry instead of opening an error screen.
  permission: 'create_meeting_room',
};
