export type UserRole = "admin" | "merchant" | "store" | "operations" | "analyst";

export type KycStatus = "SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DRAFT";

export type StoreStatus = "ACTIVE" | "PENDING_APPROVAL" | "INACTIVE";

export type OfferStatus = "CREATED" | "PENDING_APPROVAL" | "ACTIVE" | "EXPIRED" | "REJECTED" | "PAUSED";

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
  district?: string;
  state?: string;
  bankUpiId: string;
  gstin: string;
  pan: string;
  kycStatus: KycStatus;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  rating: number;
  initials: string;
  createdAt: string;
  storeCount: number;
  commissionRate?: number;
  createdBy?: string;
  createdRole?: string;
  kycReviewedBy?: string;
  kycReviewedAt?: string;
  kycReviewNotes?: string;
}

export interface Store {
  id: string;
  merchantId: string;
  merchantName: string;
  storeName: string;
  branchName: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  status: StoreStatus;
  phone: string;
  operatingHours: string;
  hasActiveOffer: boolean;
  createdAt: string;
  storeEmail?: string;
  storePin?: string;
  managerName?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  scope: "MERCHANT" | "STORE";
  merchantId?: string;
  storeId?: string;
  badgeCls?: string;
  permissions: Record<string, boolean>;
  isSystem?: boolean;
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
  status?: string;
  role?: string;
  createdAt?: string;
  tier?: string;
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

export type StaffRole = "STORE_MANAGER" | "STORE_SUPERVISOR" | "ORDER_VERIFIER" | "MARKETING_LEAD" | string;

export interface StaffPermissions {
  canViewQR: boolean;
  canViewBilling: boolean;
  canApplyDiscounts: boolean;
  canManageOffers: boolean;
  canEditTimings: boolean;
  canViewAnalytics: boolean;
  canManageStaff?: boolean;
  canManageRoles?: boolean;
  canEditBankDetails: false; // locked for staff
  canUploadKYC: false; // locked for staff
}

export interface StoreStaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  merchantId: string;
  storeId?: string; // specific store branch id, or 'ALL'
  storeName: string;
  role: StaffRole;
  pin?: string; // legacy optional, authentication is password-based
  inviteUrl?: string;
  permissions: StaffPermissions;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  createdAt: string;
  lastActive: string;
}

export type AdminRole =
  | "SUPERADMIN"
  | "REGIONAL_OPS"
  | "COMPLIANCE_KYC"
  | "FINANCE_AUDITOR"
  | "CATALOG_LEAD"
  | "SUPPORT_LEAD"
  | (string & {});

export interface AdminRoleDefinition {
  id: string;
  name: string;
  description: string;
  badgeCls: string;
  permissions: AdminPermissions;
  isSystem?: boolean;
  createdAt: string;
}

export interface AdminPermissions {
  canManageMerchants: boolean;     // Approve, reject, suspend merchants
  canVerifyKYC: boolean;           // Review PAN, GST, Aadhaar, Bank docs
  canModerateOffers: boolean;      // Approve/feature flash deals and banners
  canViewFinancials: boolean;      // Ledger, settlements, payout batches
  canManageTaxonomy: boolean;      // Categories, subcategories, tags
  canConfigurePlatform: boolean;   // Webhooks, rate limits, city geo-radius
  canManageStaff: boolean;         // Invite/revoke admin team members
}

export const ADMIN_PERMISSION_KEYS: (keyof AdminPermissions)[] = [
  "canManageMerchants",
  "canVerifyKYC",
  "canModerateOffers",
  "canViewFinancials",
  "canManageTaxonomy",
  "canConfigurePlatform",
  "canManageStaff",
];

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  permissions: AdminPermissions;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  lastLogin: string;
  createdAt: string;
  inviteUrl?: string;
}


