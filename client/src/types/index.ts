export type UserRole = "admin" | "merchant" | "operations" | "analyst";

export type KycStatus = "SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DRAFT";

export type StoreStatus = "ACTIVE" | "PENDING_APPROVAL" | "INACTIVE";

export type OfferStatus = "CREATED" | "PENDING_APPROVAL" | "ACTIVE" | "EXPIRED" | "REJECTED";

export type OfferType = "FLAT_PCT" | "FLAT_AMT" | "BOGO";

export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type SettlementStatus = "PENDING" | "SETTLED";

export type ReferenceType = "OFFER" | "RECHARGE" | "BILL" | "BUS" | "CAB";

export interface Merchant {
  id: string;
  businessName: string;
  legalEntityName: string;
  categoryId: string;
  categoryName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  bankUpiId: string;
  gstin: string;
  pan: string;
  kycStatus: KycStatus;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  rating: number;
  initials: string;
  createdAt: string;
  storeCount: number;
}

export interface Store {
  id: string;
  merchantId: string;
  merchantName: string;
  storeName: string;
  branchName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: StoreStatus;
  phone: string;
  operatingHours: string;
  hasActiveOffer: boolean;
  createdAt: string;
}

export interface Offer {
  id: string;
  merchantId: string;
  merchantName: string;
  storeId?: string; // If specific to branch, or 'all'
  title: string;
  type: OfferType;
  value: number; // e.g., 20 (%) or 200 (flat ₹)
  maxDiscount?: number;
  minBillAmount: number;
  validFrom: string;
  validTo: string;
  status: OfferStatus;
  redemptions: number;
  terms: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  paymentIntentId: string;
  referenceType: ReferenceType;
  referenceId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  storeName: string;
  billAmount: number;
  discountAmount: number;
  payableAmount: number;
  payeeVpa: string;
  upiIntentUrl: string;
  utr: string;
  signatureValid: boolean;
  status: PaymentStatus;
  settlementStatus: SettlementStatus;
  pointsEarned: number;
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  visits: number;
  rewardsBalance: number;
  segment: "Power user" | "Regular" | "New" | "At risk";
  initials: string;
  lastActive: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  parentName?: string;
  icon: string;
  color: string;
  storeCount: number;
  growth: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface RewardRule {
  id: string;
  name: string;
  earnPointsPerHundred: number;
  categoryFilter: string;
  status: "ACTIVE" | "PAUSED";
  description: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  entity: string;
  actor: string;
  time: string;
  severity: "info" | "success" | "warning" | "critical";
  metadata?: Record<string, unknown>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "merchant" | "offer" | "transaction" | "system";
  time: string;
  read: boolean;
}
