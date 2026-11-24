import { toUploadBlob } from '@/core/files';

import type { CheckInput, GpsFix } from '../types';

/** The GPS proof fields shared by check-in, check-out and the check-out preview. */
export function appendFix(form: FormData, fix: GpsFix | null) {
  if (!fix) return;
  form.append('latitude', String(fix.latitude));
  form.append('longitude', String(fix.longitude));
  if (fix.accuracy !== null) form.append('accuracy', String(fix.accuracy));
  form.append('position_timestamp', String(fix.positionTimestamp));
  form.append('client_now', String(fix.clientNow));
  form.append('is_mock', fix.isMock ? '1' : '0');
}

/** The same fields as a JSON body, for the preview that sends no photo. */
export function fixBody(fix: GpsFix | null) {
  if (!fix) return {};
  return {
    latitude: fix.latitude,
    longitude: fix.longitude,
    accuracy: fix.accuracy ?? undefined,
    position_timestamp: fix.positionTimestamp,
    client_now: fix.clientNow,
    is_mock: fix.isMock,
  };
}

/**
 * Body of check-in and check-out: the position proof and the photo. The photo comes from the
 * camera, so `photo_source` is always `camera`; the server still checks the file itself.
 */
export async function buildCapture({ fix, photo }: CheckInput): Promise<FormData> {
  const form = new FormData();
  appendFix(form, fix);
  form.append('photo_source', 'camera');
  form.append('photo', await toUploadBlob(photo), photo.name);
  return form;
}
