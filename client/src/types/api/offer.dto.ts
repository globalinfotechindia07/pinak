export type OfferType = "FLAT_PCT" | "FLAT_AMT" | "BOGO" | "CASHBACK";
export type OfferStatus = "DRAFT" | "SUBMITTED" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "DEACTIVATED" | "REJECTED";
export type OfferApprovalStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface OfferDTO {
  id: string;
  merchantId: string;
  merchantName?: string;
  storeId?: string;
  storeName?: string;
  title: string;
  description?: string;
  type: OfferType;
  value: number;
  maxDiscount?: number;
  minBillAmount: number;
  validFrom: string;
  validTo: string;
  status: OfferStatus;
  approvalStatus?: OfferApprovalStatus;
  redemptionCount?: number;
  redemptions?: number;
  termsAndConditions?: string;
  terms?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfferRequest {
  merchantId?: string;
  storeId?: string;
  title: string;
  description?: string;
  type: OfferType;
  value: number;
  maxDiscount?: number;
  minBillAmount: number;
  validFrom: string;
  validTo: string;
  termsAndConditions?: string;
}

export interface AdminOfferFilterParams {
  merchantId?: string;
  storeId?: string;
  categoryId?: string;
  status?: string;
  approvalStatus?: string;
  offerType?: string;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}
