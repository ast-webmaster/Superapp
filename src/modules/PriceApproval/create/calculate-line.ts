import type { DiscountKind } from '../types';

/** Prices include 11% VAT. A percent discount and the cash discount apply to the price without it. */
const VAT = 1.11;

export type LineInput = {
  price: number;
  qty: number;
  kind: DiscountKind;
  /** A percent or a rupiah amount, by `kind`. */
  discountValue: number;
  /** Percent, 0 to 100. */
  cashDiscount: number;
};

const money = (value: number) => Math.round(value * 100) / 100;

/**
 * What one item costs, by the same formula the server uses, so the review matches what the
 * server stores. The server recalculates and its figures win; this is only the preview.
 */
export function calculateLine({ price, qty, kind, discountValue, cashDiscount }: LineInput) {
  let priceAfterDiscount = price;
  if (kind === 'percent') {
    const withoutVat = price / VAT;
    priceAfterDiscount = (withoutVat - withoutVat * (discountValue / 100)) * VAT;
  } else if (kind === 'nominal') {
    priceAfterDiscount = price - discountValue;
  }
  const totalWithoutVat = (priceAfterDiscount * qty) / VAT;
  const amount = (totalWithoutVat - totalWithoutVat * (cashDiscount / 100)) * VAT;
  return { priceAfterDiscount: money(priceAfterDiscount), amount: money(amount) };
}

/** The number in text a user typed: "1.5" or "1,5". Empty or broken text is 0. */
export function parseAmount(text: string): number {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : 0;
}

/** Keeps digits and one decimal point, so a numeric field cannot hold anything else. */
export function sanitizeAmount(text: string): string {
  const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
}

/** Like `sanitizeAmount` for a rupiah field the user sees grouped ("100,000"): drops the commas. */
export function sanitizeMoney(text: string): string {
  return sanitizeAmount(text.replace(/,/g, ''));
}

/** "100000.5" -> "100,000.5". For showing a rupiah field while its raw value stays plain digits. */
export function groupThousands(raw: string): string {
  const [whole = '', decimals] = raw.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals === undefined ? grouped : `${grouped}.${decimals}`;
}
