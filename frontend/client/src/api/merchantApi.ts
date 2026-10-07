import apiClient from "./client";
import {
  MerchantProfileDTO,
  RegisterMerchantRequest,
  UpdateMerchantProfileRequest,
} from "../types/api/merchant.dto";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export const merchantApi = {
  // Merchant Self-Registration
  register: async (payload: RegisterMerchantRequest): Promise<MerchantProfileDTO> => {
    const res = await apiClient.post<ApiResponse<MerchantProfileDTO>>("/merchants/register", payload);
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Get Current Merchant Profile (mapped to MerchantProfileController: /api/v1/merchant/profile)
  getProfile: async (): Promise<MerchantProfileDTO> => {
    const res = await apiClient.get<ApiResponse<MerchantProfileDTO>>("/merchant/profile");
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Update Merchant Profile & UPI VPA
  updateProfile: async (payload: UpdateMerchantProfileRequest): Promise<MerchantProfileDTO> => {
    const res = await apiClient.put<ApiResponse<MerchantProfileDTO>>("/merchant/profile", payload);
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Submit KYC Documents
  submitKyc: async (formData: FormData): Promise<void> => {
    await apiClient.post("/merchant/kyc", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Admin / General: Create & Onboard Merchant Business Profile
  createMerchant: async (payload: {
    businessName: string;
    legalName?: string;
    description?: string;
    categoryId?: string;
    phone?: string;
    email?: string;
    website?: string;
    bankUpiId?: string;
    gstin?: string;
    pan?: string;
  }): Promise<MerchantProfileDTO> => {
    const res = await apiClient.post<ApiResponse<MerchantProfileDTO>>("/merchants", payload);
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Get Merchant by ID
  getMerchantById: async (id: string): Promise<MerchantProfileDTO> => {
    const res = await apiClient.get<ApiResponse<MerchantProfileDTO>>(`/merchants/${id}`);
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Admin: List All Merchants
  getMerchantsAdmin: async (params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<MerchantProfileDTO>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<MerchantProfileDTO>>>("/admin/merchants", {
      params,
    });
    return res.data?.data || (res.data as unknown as PaginatedResponse<MerchantProfileDTO>);
  },

  // Admin: Approve Merchant
  approveMerchantAdmin: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/merchants/${id}/approve`);
  },

  // Admin: Reject Merchant
  rejectMerchantAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/merchants/${id}/reject`, { reason });
  },

  // Admin: Suspend Merchant
  suspendMerchantAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/merchants/${id}/suspend`, { reason });
  },

  // Admin: Activate Merchant
  activateMerchantAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/merchants/${id}/activate`, null, { params: { reason } });
  },

  // Admin: Update Merchant Profile
  updateMerchantAdmin: async (id: string, payload: any): Promise<MerchantProfileDTO> => {
    const res = await apiClient.put<ApiResponse<MerchantProfileDTO>>(`/admin/merchants/${id}`, payload);
    return res.data?.data || (res.data as unknown as MerchantProfileDTO);
  },

  // Admin: Resend Welcome / Invitation Email
  resendInvite: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/merchants/${id}/resend-invite`);
  },

  // Delete Merchant
  deleteMerchant: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/admin/merchants/${id}`);
    } catch {
      await apiClient.delete(`/merchants/${id}`);
    }
  },
};
