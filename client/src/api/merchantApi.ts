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
};
