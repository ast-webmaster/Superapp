import { formatDateTime } from '@/shared/utils/format';

const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

const pad = (value: number) => String(value).padStart(2, '0');

/** When the data on screen came from the server: time only today, date and time before. */
export function formatSyncedAt(timestamp: number) {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString()
    ? time.format(date)
    : formatDateTime(
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`,
      );
}
