import type { GimmickAction, GimmickFlow } from './types';

export type FlowConfig = {
  flow: GimmickFlow;
  /** The API path under `/v1`, the manifest id and the first segment of every query key. */
  slug: string;
  title: string;
  description: string;
  /** What one document is called in sentences: "inbound", "request". */
  noun: string;
  /** What the create button says. */
  createLabel: string;
  createPermission: string;
  /** Statuses that mean someone still has to act, joined for the "Awaiting" chip. */
  awaitingStatuses: string;
  /** The status the "done" chip filters by, and what it says. */
  doneStatus: string;
  /** Statuses the filter sheet offers; the list takes any other value too. */
  statuses: readonly string[];
  /** The document goes to a chosen office. Inbound always lands in the user's own office. */
  needsOffice: boolean;
  docLabel: string;
  docRequired: boolean;
  /** Actions that need a reason (`remarks`) before the server accepts them. */
  reasonRequired: readonly GimmickAction[];
  /** The hint under the item picker's stock figure. */
  itemsHelp: string;
};

export const flows: Record<GimmickFlow, FlowConfig> = {
  inbound: {
    flow: 'inbound',
    slug: 'marketing-inbound',
    title: 'Marketing Inbound',
    description: 'Record gimmick items that arrive and approve them into stock',
    noun: 'inbound',
    createLabel: 'New inbound',
    createPermission: 'create_marketing_inbound_transactions',
    awaitingStatuses: 'AWAITING',
    doneStatus: 'SUCCESS',
    statuses: ['AWAITING', 'SUCCESS', 'REJECTED'],
    needsOffice: false,
    docLabel: 'Proof',
    docRequired: true,
    reasonRequired: ['reject'],
    itemsHelp: 'Approving adds these items to your office stock.',
  },
  request: {
    flow: 'request',
    slug: 'marketing-request',
    title: 'Marketing Request',
    description: 'Request gimmick items from Head Office stock',
    noun: 'request',
    createLabel: 'New request',
    createPermission: 'create_marketing_request_transactions',
    awaitingStatuses: 'AWAITING,AWAITING PROCESSED,AWAITING RECEIVED',
    doneStatus: 'RECEIVED',
    statuses: [
      'AWAITING',
      'AWAITING PROCESSED',
      'AWAITING RECEIVED',
      'RECEIVED',
      'REJECT',
      'CANCEL',
    ],
    needsOffice: true,
    docLabel: 'Attachment',
    docRequired: false,
    reasonRequired: ['approve', 'reject', 'process'],
    itemsHelp: 'Head Office stock is reserved as soon as you submit.',
  },
};
