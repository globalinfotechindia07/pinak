import apiClient from "./client";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export interface OfferDTO {
  id: string;
  merchantId: string;
  merchantName?: string;
  storeId?: string;
  storeName?: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  tagline?: string;
  description?: string;
  type: string;
  value: number;
  minTransactionAmount?: number;
  minBillAmount?: number;
  maxDiscountAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  maxTotalRedemptions?: number;
  perCustomerLimit?: number;
  perUserLimit?: number;
  currentUsageCount?: number;
  redemptions?: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "PAUSED" | "CREATED" | "PENDING_APPROVAL" | "REJECTED" | "DRAFT";
  approvalStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DRAFT";
  rejectionReason?: string;
  termsAndConditions?: string;
  terms?: string;
  applicableStoreIds?: string[];
  activeDays?: string[];
  happyHoursStart?: string;
  happyHoursEnd?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfferPayload {
  merchantId?: string;
  storeId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  type: string;
  value: number;
  minTransactionAmount?: number;
  minBillAmount?: number;
  maxDiscountAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  applicableStoreIds?: string[];
  activeDays?: string[];
  happyHoursStart?: string;
  happyHoursEnd?: string;
  termsAndConditions?: string;
}

export const offerApi = {
  // Admin: List all offers
  getAdminOffers: async (params?: PaginationParams & { status?: string; approvalStatus?: string; activeOnly?: boolean }): Promise<OfferDTO[]> => {
    const res = await apiClient.get<ApiResponse<OfferDTO[] | PaginatedResponse<OfferDTO>>>("/admin/offers", { params });
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (data && "content" in data && Array.isArray((data as any).content)) return (data as any).content;
    return [];
  },

  // Merchant: List offers belonging to authenticated merchant
  getMyOffers: async (params?: PaginationParams & { storeId?: string; status?: string; approvalStatus?: string }): Promise<OfferDTO[]> => {
    const res = await apiClient.get<ApiResponse<OfferDTO[] | PaginatedResponse<OfferDTO>>>("/merchant/offers", { params });
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (data && "content" in data && Array.isArray((data as any).content)) return (data as any).content;
    return [];
  },

  // Merchant: Create a new offer
  createOffer: async (payload: CreateOfferPayload): Promise<OfferDTO> => {
    const res = await apiClient.post<ApiResponse<OfferDTO>>("/merchant/offers", payload);
    return res.data?.data || (res.data as unknown as OfferDTO);
  },

  // Merchant: Update an existing offer
  updateOffer: async (id: string, payload: Partial<CreateOfferPayload>): Promise<OfferDTO> => {
    const res = await apiClient.put<ApiResponse<OfferDTO>>(`/merchant/offers/${id}`, payload);
    return res.data?.data || (res.data as unknown as OfferDTO);
  },

  // Merchant: Delete an offer
  deleteOffer: async (id: string): Promise<void> => {
    await apiClient.delete(`/merchant/offers/${id}`);
  },

  // Merchant: Toggle status (ACTIVE / PAUSED)
  toggleOfferStatus: async (id: string, status: string): Promise<OfferDTO> => {
    const res = await apiClient.patch<ApiResponse<OfferDTO>>(`/merchant/offers/${id}/status`, null, { params: { status } });
    return res.data?.data || (res.data as unknown as OfferDTO);
  },

  // Merchant: Submit offer for approval
  submitOffer: async (id: string): Promise<void> => {
    await apiClient.post(`/merchant/offers/${id}/submit`);
  },

  // Admin: Approve offer
  approveOfferAdmin: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/offers/${id}/approve`);
  },

  // Admin: Reject offer
  rejectOfferAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/offers/${id}/reject`, { rejectionReason: reason || "Does not meet guidelines" });
  },

  // Discovery: Active offers for a store
  getStoreOffers: async (storeId: string): Promise<OfferDTO[]> => {
    const res = await apiClient.get<ApiResponse<OfferDTO[]>>(`/discovery/stores/${storeId}/offers`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  },

  // Merchant: Get audit logs for offer
  getOfferAuditLogs: async (id: string): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>(`/merchant/offers/${id}/audit-logs`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};
