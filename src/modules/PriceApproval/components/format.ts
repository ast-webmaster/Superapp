const money = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dateTime = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatMoney = (value: number) => money.format(value);

/** When the data on screen came from the server: time only today, date and time before. */
export function formatSyncedAt(timestamp: number) {
  const date = new Date(timestamp);
  return date.toDateString() === new Date().toDateString()
    ? time.format(date)
    : dateTime.format(date);
}
