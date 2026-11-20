/** 1234 -> "1,234". */
export function formatQuantity(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** A movement's quantity with its sign: 140 -> "+140", -20 -> "-20", 0 -> "0". */
export function formatSignedQuantity(value: number): string {
  if (value > 0) return `+${formatQuantity(value)}`;
  if (value < 0) return `-${formatQuantity(-value)}`;
  return '0';
}
