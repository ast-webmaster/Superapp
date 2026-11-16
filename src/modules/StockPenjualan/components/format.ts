import type { StockSalesItem } from '../types';

/** 1234 -> "1,234". A missing figure (the account has no office, say) shows as a dash. */
export function formatQuantity(value: number | null): string {
  if (value === null) return '-';
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** The server hides the exact HQ figure from 100 up; sales see "> 100" instead of a number. */
export function formatHqStock(
  item: Pick<StockSalesItem, 'stock_hq' | 'stock_hq_over_100'>,
): string {
  return item.stock_hq_over_100 ? '> 100' : formatQuantity(item.stock_hq);
}
