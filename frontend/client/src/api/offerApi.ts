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
  description?: string;
  type: string;
  value: number;
  minTransactionAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  currentUsageCount?: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "PAUSED";
  approvalStatus: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt?: string;
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
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  perCustomerLimit?: number;
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
  getMyOffers: async (params?: PaginationParams & { storeId?: string; status?: string }): Promise<OfferDTO[]> => {
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
};
