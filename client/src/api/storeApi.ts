import apiClient from "./client";
import {
  CreateStoreRequest,
  StoreDTO,
  StoreStatus,
  UpdateStoreRequest,
} from "../types/api/store.dto";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export const storeApi = {
  // Get Branches for Current Authenticated Merchant
  getMyStores: async (): Promise<StoreDTO[]> => {
    const res = await apiClient.get<ApiResponse<StoreDTO[]>>("/merchant/stores");
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // Get Store Branch by ID (Admin)
  getAdminStoreById: async (id: string): Promise<StoreDTO> => {
    const res = await apiClient.get<ApiResponse<StoreDTO>>(`/admin/stores/${id}`);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Get Store Branch by ID (Merchant)
  getStoreById: async (id: string): Promise<StoreDTO> => {
    const res = await apiClient.get<ApiResponse<StoreDTO>>(`/stores/${id}`);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Universal Store Branch Creation (Admin & Merchant)
  createStore: async (payload: CreateStoreRequest): Promise<StoreDTO> => {
    const res = await apiClient.post<ApiResponse<StoreDTO>>("/stores", payload);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Update Store Branch (Address, Contact, Hours, Coordinates)
  updateStore: async (id: string, payload: UpdateStoreRequest): Promise<StoreDTO> => {
    const res = await apiClient.put<ApiResponse<StoreDTO>>(`/merchant/stores/${id}`, payload);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Delete Merchant Store Branch
  deleteMerchantStore: async (id: string): Promise<void> => {
    await apiClient.delete(`/merchant/stores/${id}`);
  },

  // Resend Activation / Welcome Invite Link to Store Branch Manager
  resendManagerInvite: async (id: string): Promise<void> => {
    await apiClient.post(`/merchant/stores/${id}/resend-invite`);
  },

  // Submit Store for Review
  submitStoreForReview: async (id: string): Promise<void> => {
    await apiClient.post(`/merchant/stores/${id}/submit`);
  },

  // Toggle Store Status (Instant Open/Closed)
  updateStoreStatus: async (id: string, status: StoreStatus): Promise<StoreDTO> => {
    const res = await apiClient.patch<ApiResponse<StoreDTO>>(`/admin/stores/${id}/status`, { status });
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Admin: List All Stores Across Merchants with Pagination & Filters
  getAllStoresAdmin: async (params?: PaginationParams & { cityId?: string; status?: string; approvalStatus?: string }): Promise<PaginatedResponse<StoreDTO>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StoreDTO>>>("/admin/stores", { params });
    return res.data?.data || (res.data as unknown as PaginatedResponse<StoreDTO>);
  },

  // Admin: Approve Store Branch
  approveStoreAdmin: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/approve`);
  },

  // Admin: Reject Store Branch with mandatory reason
  rejectStoreAdmin: async (id: string, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/reject`, { reason });
  },

  // Admin: Suspend Store Branch with mandatory reason
  suspendStoreAdmin: async (id: string, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/suspend`, { reason });
  },

  // Admin: Reactivate Suspended Store Branch
  activateStoreAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/activate`, null, { params: { reason } });
  },

  // PostGIS Discovery Test (Radius Search)
  getNearbyStores: async (lat: number, lng: number, radiusMeters: number = 5000): Promise<StoreDTO[]> => {
    const res = await apiClient.get<ApiResponse<StoreDTO[]>>("/discovery/nearby", {
      params: { lat, lng, radiusMeters },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },
};
