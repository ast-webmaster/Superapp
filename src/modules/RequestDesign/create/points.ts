import type { PointCategoryOption } from '../types';
import { MAX_QTY } from './draft';

/** The category the server leaves out of the total, since it needs no matching piece of work. */
export const OPTIONAL_CATEGORY = 'OPTIONAL';

/** Digits typed for each category, keyed by category uuid. Empty counts as 0. */
export type Quantities = Record<string, string>;

const quantityOf = (value: string | undefined) => Number(value || 0);

/** The pieces counted against the request, which may not pass its total (OPTIONAL is exempt). */
export function countedQty(categories: readonly PointCategoryOption[], values: Quantities): number {
  return categories
    .filter((category) => category.name !== OPTIONAL_CATEGORY)
    .reduce((sum, category) => sum + quantityOf(values[category.uuid]), 0);
}

/** Why these quantities would be refused, or undefined when they are fine. */
export function pointsProblem(
  categories: readonly PointCategoryOption[],
  values: Quantities,
  totalQty: number,
): string | undefined {
  const bad = categories.some((category) => {
    const qty = quantityOf(values[category.uuid]);
    return !Number.isInteger(qty) || qty < 0 || qty > MAX_QTY;
  });
  if (bad) return `Each quantity is a whole number from 0 to ${MAX_QTY}.`;
  if (countedQty(categories, values) > totalQty) {
    return `The quantities add up to more than the ${totalQty} pieces requested.`;
  }
  return undefined;
}
