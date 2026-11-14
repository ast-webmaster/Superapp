import type { PickedFile } from '@/core/files';

import { checkAttachment } from './attachment-rules';
import { dayLabel, isSameDay, localDate } from './day-label';
import { newTraceId } from './trace-id';

const MB = 1024 * 1024;
const file = (name: string, size: number | null = MB): PickedFile => ({
  uri: `file:///${name}`,
  name,
  mimeType: null,
  size,
});
// Saturday 14 Nov 2026, 15:00 on the phone's clock.
const now = new Date(2026, 10, 14, 15, 0);
const at = (day: number, hour: number, minute: number) =>
  new Date(2026, 10, day, hour, minute).toISOString();

describe('newTraceId', () => {
  it('makes a v4 uuid', () => {
    expect(newTraceId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('makes a different id each time', () => {
    expect(newTraceId()).not.toBe(newTraceId());
  });
});

describe('dayLabel', () => {
  it('says Today with the time for today', () => {
    expect(dayLabel(at(14, 14, 42), now)).toBe('Today · 14:42');
  });

  it('says Yesterday for the day before', () => {
    expect(dayLabel(at(13, 9, 5), now)).toBe('Yesterday · 09:05');
  });

  it('gives the weekday and date for older days', () => {
    expect(dayLabel(at(11, 9, 5), now)).toBe('Rab, 11 Nov · 09:05');
  });

  it('compares days on the phone clock', () => {
    expect(isSameDay(at(14, 0, 1), at(14, 23, 59))).toBe(true);
    expect(isSameDay(at(13, 23, 59), at(14, 0, 1))).toBe(false);
  });
});

describe('checkAttachment', () => {
  it('allows at most 3 files', () => {
    const three = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
    expect(checkAttachment(file('d.pdf'), three)).toBe('You can attach up to 3 files.');
  });

  it('refuses a type the server does not read', () => {
    expect(checkAttachment(file('x.exe'), [])).toBe(
      'This file type is not supported. Use pdf, png, jpg, docx or xlsx.',
    );
  });

  it('refuses a file over 10 MB', () => {
    expect(checkAttachment(file('big.pdf', 11 * MB), [])).toBe('Files can be up to 10 MB.');
  });

  it('refuses an image over 5 MB, whatever the case of its extension', () => {
    expect(checkAttachment(file('photo.PNG', 6 * MB), [])).toBe('Images can be up to 5 MB.');
  });

  it('accepts a valid file', () => {
    expect(checkAttachment(file('sheet.xlsx', 2 * MB), [])).toBeNull();
  });

  it('leaves an unknown size to the server', () => {
    expect(checkAttachment(file('doc.docx', null), [])).toBeNull();
  });
});

describe('localDate', () => {
  it('uses the phone calendar, not the UTC date in the text', () => {
    expect(localDate(new Date(2026, 10, 14, 0, 30).toISOString())).toBe('14 Nov 2026');
  });
});
