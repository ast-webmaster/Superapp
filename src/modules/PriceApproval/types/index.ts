export type PriceApprovalStatus = 'pending' | 'approved' | 'rejected';

/** The list screen can show one status or everything. */
export type PriceApprovalFilter = PriceApprovalStatus | 'all';

// ASSUMED shape: placeholder until the backend contract for this module is defined.
export type PriceApproval = {
  id: number;
  code: string;
  itemName: string;
  requestedPrice: number;
  requestedBy: string;
  status: PriceApprovalStatus;
};
