import { toAppError } from '@/core/errors';

import type {
  DraftCost,
  DraftDestination,
  OnDutyOptions,
  OnDutyRequestDetail,
  OnDutyRequestDraft,
  TripType,
} from '../types';
import { parseAmount } from './amount';
import { daysInRange, rangesOverlap } from './dates';

/** The server's limits (`SubmitOnDutyRequestRequest`). */
export const MAX_ROWS = 50;
export const MAX_ATTACHMENTS = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_AMOUNT = 9_999_999_999_999;
/** The `need_pr` of an expense HRGA hands out as a voucher: it always costs nothing. */
export const VOUCHER = 'VOUCHER';

export const STEPS = [
  { key: 'details', title: 'Details' },
  { key: 'destinations', title: 'Destinations' },
  { key: 'costs', title: 'Costs' },
  { key: 'attachments', title: 'Attachments' },
  { key: 'review', title: 'Review' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];

export const emptyDraft: OnDutyRequestDraft = {
  type: null,
  purpose: '',
  remarks: '',
  letter: null,
  brands: [],
  sharing: {},
  destinations: [],
  costs: [],
  attachments: [],
};

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export const newDestination = (): DraftDestination => ({
  id: localId(),
  destination: null,
  startDate: null,
  endDate: null,
});

export const newCost = (): DraftCost => ({
  id: localId(),
  item: null,
  amount: '',
  sharing: false,
  remarks: '',
});

/** What the validators need besides the draft itself. */
export type FormContext = {
  /** A new request needs the letter; a resubmit keeps the one on the server. */
  letterRequired: boolean;
  /** Allowance per day for the chosen trip type. Null: the account has none set. */
  allowanceRate: number | null;
};

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

export function isVoucher(cost: Pick<DraftCost, 'item'>): boolean {
  return cost.item?.need_pr === VOUCHER;
}

export const costAmount = (cost: DraftCost) => (isVoucher(cost) ? 0 : parseAmount(cost.amount));

export const costTotal = (draft: OnDutyRequestDraft) =>
  draft.costs.reduce((sum, cost) => sum + costAmount(cost), 0);

export const destinationDays = (row: DraftDestination) => daysInRange(row.startDate, row.endDate);

/** The allowance the server will calculate: the account's daily rate for every day of every stop. */
export function allowanceTotal(draft: OnDutyRequestDraft, rate: number | null): number {
  if (rate === null) return 0;
  return draft.destinations.reduce((sum, row) => sum + destinationDays(row) * rate, 0);
}

export function allowanceRate(options: OnDutyOptions, type: TripType | null): number | null {
  if (type === null) return null;
  return options.pocket_money[type === 'DOMESTIC' ? 'domestic' : 'overseas'];
}

/** Sum of the typed percentages of brands that are still selected. */
function sharingTotal(draft: OnDutyRequestDraft): number {
  return draft.brands.reduce((sum, code) => sum + parseAmount(draft.sharing[code] ?? ''), 0);
}

export function validateDetails(draft: OnDutyRequestDraft, context: FormContext): Errors {
  const errors: Errors = {};
  if (!draft.type) errors.type = 'Choose where you are going.';
  if (!draft.purpose.trim()) errors.purpose = 'Write the purpose of this trip.';
  if (!draft.remarks.trim()) errors.remarks = 'Write a note for the approvers.';
  if (draft.brands.length === 0) errors.brands = 'Choose at least one brand.';
  if (!draft.letter && context.letterRequired) {
    errors.letter = 'Attach the letter of assignment.';
  } else if (draft.letter?.size != null && draft.letter.size > MAX_FILE_BYTES) {
    errors.letter = 'This file is larger than 10 MB.';
  }

  const filled = draft.brands.filter((code) => (draft.sharing[code] ?? '').trim() !== '');
  if (filled.length > 0) {
    const invalid = filled.some((code) => {
      const value = parseAmount(draft.sharing[code] ?? '');
      return !Number.isInteger(value) || value < 1 || value > 100;
    });
    if (invalid) errors.sharing = 'Each percentage is a whole number from 1 to 100.';
    else if (sharingTotal(draft) !== 100) errors.sharing = 'The percentages must add up to 100.';
  }
  return errors;
}

/** One stop on its own. `others` are the other stops: the server refuses dates that overlap. */
export function validateDestination(row: DraftDestination, others: DraftDestination[]): Errors {
  const errors: Errors = {};
  if (!row.destination) errors.destination = 'Choose a destination.';
  if (!row.startDate || !row.endDate) {
    errors.dates = 'Choose the first and the last day.';
    return errors;
  }
  const range = { start: row.startDate, end: row.endDate };
  const clash = others.some(
    (other) =>
      other.startDate &&
      other.endDate &&
      rangesOverlap(range, { start: other.startDate, end: other.endDate }),
  );
  if (clash) errors.dates = 'These days overlap another destination.';
  return errors;
}

export function validateDestinations(draft: OnDutyRequestDraft, context: FormContext): Errors {
  if (draft.destinations.length === 0) return { destinations: 'Add at least one destination.' };
  if (context.allowanceRate === null) {
    return {
      destinations:
        'Your account has no daily allowance for this trip type, so the request would be refused. Ask HRGA to set it.',
    };
  }
  return {};
}

export function validateCost(cost: DraftCost): Errors {
  const errors: Errors = {};
  if (!cost.item) errors.item = 'Choose an expense.';
  if (!isVoucher(cost)) {
    if (cost.amount.trim() === '') errors.amount = 'Enter the estimated amount.';
    else if (parseAmount(cost.amount) > MAX_AMOUNT) errors.amount = 'This amount is too large.';
  }
  return errors;
}

export function validateCosts(draft: OnDutyRequestDraft): Errors {
  return draft.costs.length === 0 ? { costs: 'Add at least one cost.' } : {};
}

/** Attachments are optional, but each one needs a description and must fit the server's limit. */
export function validateAttachments(draft: OnDutyRequestDraft): Errors {
  const errors: Errors = {};
  for (const { id, description, file } of draft.attachments) {
    if (!description.trim()) errors[id] = 'Describe this file.';
    else if (file.size !== null && file.size > MAX_FILE_BYTES) {
      errors[id] = 'This file is larger than 10 MB.';
    }
  }
  return errors;
}

export function validateStep(
  step: StepKey,
  draft: OnDutyRequestDraft,
  context: FormContext,
): Errors {
  if (step === 'details') return validateDetails(draft, context);
  if (step === 'destinations') return validateDestinations(draft, context);
  if (step === 'costs') return validateCosts(draft);
  if (step === 'attachments') return validateAttachments(draft);
  return {};
}

/** The first step that holds a problem, so Submit can send the user back to it. */
export function firstInvalidStep(draft: OnDutyRequestDraft, context: FormContext): StepKey | null {
  return (
    STEPS.find(({ key }) => Object.keys(validateStep(key, draft, context)).length > 0)?.key ?? null
  );
}

/** True once the user has typed or chosen anything, so leaving asks first. */
export function isDirty(
  draft: OnDutyRequestDraft,
  initial: OnDutyRequestDraft = emptyDraft,
): boolean {
  return JSON.stringify(withoutIds(draft)) !== JSON.stringify(withoutIds(initial));
}

function withoutIds(draft: OnDutyRequestDraft) {
  return {
    ...draft,
    letter: draft.letter?.uri ?? null,
    destinations: draft.destinations.map(({ id: _id, ...row }) => row),
    costs: draft.costs.map(({ id: _id, ...row }) => row),
    attachments: draft.attachments.map(({ id: _id, description, file }) => ({
      description,
      file: file.uri,
    })),
  };
}

/** A resubmit starts from what the server holds. Files cannot be fetched back, so they are not part of it. */
export function draftFromDetail(detail: OnDutyRequestDetail): OnDutyRequestDraft {
  return {
    type: detail.type === 'DOMESTIC' || detail.type === 'OVERSEAS' ? detail.type : null,
    purpose: detail.purpose ?? '',
    remarks: detail.remarks ?? '',
    letter: null,
    brands: detail.brands.map((brand) => brand.category_code),
    sharing: Object.fromEntries(
      detail.sharing.map((row) => [row.category_code, String(row.percentage)]),
    ),
    destinations: detail.destinations.map((row) => ({
      id: localId(),
      destination: row.destination,
      startDate: row.start_date,
      endDate: row.end_date,
    })),
    costs: detail.costs.map((cost) => ({
      id: localId(),
      item: {
        item_code: cost.item_code,
        item_description: cost.item_description,
        need_pr: cost.need_pr,
      },
      amount: String(cost.amount),
      sharing: cost.sharing_costs === 'YES',
      remarks: cost.remarks ?? '',
    })),
    attachments: [],
  };
}

/**
 * What to tell the user about a refused submit. A 422 carries one message per wrong field, which
 * says more than the generic "Validasi gagal".
 */
export function submitFailureMessage(error: unknown): string {
  const failure = toAppError(error);
  const first = failure.fieldErrors ? Object.values(failure.fieldErrors).flat()[0] : undefined;
  return first ?? failure.message;
}
