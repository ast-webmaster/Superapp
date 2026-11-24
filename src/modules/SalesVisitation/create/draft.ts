import { toAppError } from '@/core/errors';

import type { SalesVisitationDetail, SalesVisitationDraft } from '../types';

export const MAX_TITLE = 255;
export const MAX_CUSTOMER_NAME = 255;

export const emptyDraft: SalesVisitationDraft = {
  unregistered: false,
  customer: null,
  customerName: '',
  title: '',
  date: null,
  location: null,
  purposeIds: [],
  categoryCodes: [],
  plan: '',
  result: '',
};

/** The form of an existing visit, filled in from the server's copy. */
export function draftFromDetail(detail: SalesVisitationDetail): SalesVisitationDraft {
  return {
    unregistered: !detail.customer_registered,
    customer:
      detail.customer_registered && detail.customer_id
        ? {
            customer_id: detail.customer_id,
            customer_name: detail.customer_name ?? detail.customer_id,
          }
        : null,
    customerName: detail.customer_registered ? '' : (detail.customer_name ?? ''),
    title: detail.title,
    date: detail.visitation_date,
    location: {
      latitude: detail.latitude,
      longitude: detail.longitude,
      label: detail.location_label ?? '',
    },
    purposeIds: detail.purposes.map(({ id }) => id),
    categoryCodes: detail.categories.map(({ category_code }) => category_code),
    plan: detail.plan,
    result: detail.result ?? '',
  };
}

/** Error text by field name. A field with no entry is fine. */
export type Errors = Record<string, string>;

/**
 * What is wrong with the form, so an obviously bad request is never sent. The server validates
 * again. Once a visit has been checked in, only the result can change, so only it is checked.
 */
export function validateForm(draft: SalesVisitationDraft, resultOnly = false): Errors {
  if (resultOnly) return {};

  const errors: Errors = {};
  if (draft.unregistered) {
    if (!draft.customerName.trim()) errors.customer = 'Enter the customer name.';
  } else if (!draft.customer) {
    errors.customer = 'Choose a customer.';
  }
  if (!draft.title.trim()) errors.title = 'Enter a title.';
  if (!draft.date) errors.date = 'Choose the visit date.';
  if (!draft.location) errors.location = 'Choose where the visit takes place.';
  if (draft.purposeIds.length === 0) errors.purposes = 'Choose at least one purpose.';
  if (draft.categoryCodes.length === 0) errors.categories = 'Choose at least one brand category.';
  if (!draft.plan.trim()) errors.plan = 'Write what you plan to do.';
  return errors;
}

export function isDirty(draft: SalesVisitationDraft, initial: SalesVisitationDraft): boolean {
  return JSON.stringify(draft) !== JSON.stringify(initial);
}

/**
 * What to tell the user about a refused write. A 422 carries one message per wrong field, which
 * says more than a generic "Validation failed".
 */
export function submitFailureMessage(error: unknown): string {
  const failure = toAppError(error);
  const first = failure.fieldErrors ? Object.values(failure.fieldErrors).flat()[0] : undefined;
  return first ?? failure.message;
}

/** A `Date` as YYYY-MM-DD in the phone's own time zone. */
export function todayIso(now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Reads "-6.2, 106.8" (or a space instead of the comma) as a point. Null when it is not one. */
export function parseCoordinates(text: string): { latitude: number; longitude: number } | null {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(text);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

/** "-6.20000, 106.81667", short enough for a row. */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
