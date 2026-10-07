export type KycStatus = "PENDING_SUBMISSION" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface KycDocumentDTO {
  id: string;
  documentType: "PAN" | "GSTIN" | "FSSAI" | "UDYAM" | "SHOP_ESTABLISHMENT";
  documentNumber: string;
  fileUrl: string;
  status: KycStatus;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface MerchantProfileDTO {
  id: string;
  userId: string;
  businessName: string;
  legalEntityName?: string;
  categoryId: string;
  categoryName?: string;
  gstin?: string;
  panNumber?: string;
  bankUpiId: string; // Zero-escrow direct UPI settlement VPA
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  accountHolderName?: string;
  kycStatus: KycStatus;
  status: "ACTIVE" | "PENDING_APPROVAL" | "SUSPENDED";
  documents: KycDocumentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterMerchantRequest {
  businessName: string;
  categoryId: string;
  phone: string;
  email?: string;
  bankUpiId: string;
  address: string;
  cityId: string;
}

export interface UpdateMerchantProfileRequest {
  businessName?: string;
  legalEntityName?: string;
  categoryId?: string;
  bankUpiId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  accountHolderName?: string;
}
