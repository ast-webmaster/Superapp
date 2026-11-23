import { toAppError } from '@/core/errors';

import type { DraftItem, RequestDesignDetail, RequestDesignDraft } from '../types';

export const MAX_ITEMS = 50;
export const MAX_QTY = 500;
export const MAX_SIZE_CM = 100_000;
export const MAX_DESCRIPTION = 5000;
export const MAX_THEME = 191;
export const MAX_REMARKS = 1000;
export const MAX_DURASI = 50;

export const emptyDraft: RequestDesignDraft = {
  dueDate: null,
  brands: [],
  description: '',
  themeConcept: '',
  items: [],
};

let counter = 0;
/** A local id for lists and editing. Never sent to the server. */
export const localId = () => `local-${(counter += 1)}`;

export function newItem(): DraftItem {
  return {
    id: localId(),
    serverId: null,
    type: null,
    qty: '',
    purpose: null,
    media: null,
    width: '',
    length: '',
    durasi: '',
    remarks: '',
    kept: [null, null, null],
    files: [null, null, null],
  };
}

/** The form for an existing document, filled in with what the server holds. */
export function draftFromDetail(detail: RequestDesignDetail): RequestDesignDraft {
  return {
    dueDate: detail.due_date,
    brands: detail.brands.map((brand) => brand.category_code),
    description: detail.description,
    themeConcept: detail.theme_concept,
    items: detail.items.map((item) => {
      const name = (slot: number) => item.references.find((ref) => ref.slot === slot)?.name ?? null;
      return {
        ...newItem(),
        serverId: item.id,
        type: item.type,
        qty: String(item.qty),
        purpose: item.purpose,
        media: item.media,
        width: item.width === null ? '' : String(item.width),
        length: item.length === null ? '' : String(item.length),
        durasi: item.durasi ?? '',
        remarks: item.remarks ?? '',
        kept: [name(1), name(2), name(3)],
      };
    }),
  };
}

/** A `Date` as YYYY-MM-DD in the phone's own time zone. */
export function todayIso(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

const isWhole = (value: string, max: number) => {
  const number = Number(value);
  return value.trim() !== '' && Number.isInteger(number) && number >= 1 && number <= max;
};

/** The same rules the server applies to one item: what an item needs follows its type. */
export function validateItem(item: DraftItem): Errors {
  const errors: Errors = {};
  if (!item.type) errors.type = 'Choose what to design.';

  if (!isWhole(item.qty, MAX_QTY)) errors.qty = `Enter a whole number from 1 to ${MAX_QTY}.`;

  if (item.type === 'IMAGE') {
    if (!item.purpose) errors.purpose = 'Choose digital or physical.';
    if (item.purpose === 'DIGITAL' && !item.media) errors.media = 'Choose where it will be used.';
    if (item.purpose === 'FISIK') {
      if (!isWhole(item.width, MAX_SIZE_CM)) errors.width = 'Enter the width in cm.';
      if (!isWhole(item.length, MAX_SIZE_CM)) errors.length = 'Enter the length in cm.';
    }
  }
  if (item.type === 'VIDEO') {
    if (!item.durasi.trim()) errors.durasi = 'Enter the duration.';
    else if (item.durasi.trim().length > MAX_DURASI) {
      errors.durasi = `Use at most ${MAX_DURASI} characters.`;
    }
  }
  if (item.remarks.trim().length > MAX_REMARKS) {
    errors.remarks = `Use at most ${MAX_REMARKS} characters.`;
  }
  return errors;
}

/** `today` is a parameter so a test does not depend on the clock. */
export function validateForm(draft: RequestDesignDraft, today: string = todayIso()): Errors {
  const errors: Errors = {};
  if (!draft.dueDate) errors.dueDate = 'Choose the due date.';
  else if (draft.dueDate < today) errors.dueDate = 'Choose today or a later date.';

  if (draft.brands.length === 0) errors.brands = 'Choose at least one brand.';

  if (!draft.description.trim()) errors.description = 'Describe what you need.';
  else if (draft.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Use at most ${MAX_DESCRIPTION} characters.`;
  }

  if (!draft.themeConcept.trim()) errors.themeConcept = 'Write the theme or concept.';
  else if (draft.themeConcept.trim().length > MAX_THEME) {
    errors.themeConcept = `Use at most ${MAX_THEME} characters.`;
  }

  if (draft.items.length === 0) errors.items = 'Add at least one item.';
  else if (draft.items.length > MAX_ITEMS) errors.items = `Use at most ${MAX_ITEMS} items.`;
  else if (draft.items.some((item) => Object.keys(validateItem(item)).length > 0)) {
    errors.items = 'Finish the items marked below.';
  }
  return errors;
}

export function totalQty(draft: RequestDesignDraft): number {
  return draft.items.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);
}

/** True once the form differs from where it started, so leaving asks first. */
export function isDirty(draft: RequestDesignDraft, initial: RequestDesignDraft): boolean {
  return JSON.stringify(draft) !== JSON.stringify(initial);
}

/**
 * What to tell the user about a refused write. A 422 carries one message per wrong field, which
 * says more than the generic "Validasi gagal".
 */
export function submitFailureMessage(error: unknown): string {
  const failure = toAppError(error);
  const first = failure.fieldErrors ? Object.values(failure.fieldErrors).flat()[0] : undefined;
  return first ?? failure.message;
}
