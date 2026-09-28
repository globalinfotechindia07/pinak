import apiClient from "./client";
import {
  CreateStoreRequest,
  StoreDTO,
  StoreStatus,
  UpdateStoreRequest,
} from "../types/api/store.dto";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export const storeApi = {
  // Get Branches for Current Authenticated Merchant (mapped to MerchantStoreController)
  getMyStores: async (): Promise<StoreDTO[]> => {
    const res = await apiClient.get<ApiResponse<StoreDTO[]>>("/merchant/stores");
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // Get Store Branch by ID
  getStoreById: async (id: string): Promise<StoreDTO> => {
    const res = await apiClient.get<ApiResponse<StoreDTO>>(`/merchant/stores/${id}`);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Create New Store Branch with Lat & Lng
  createStore: async (payload: CreateStoreRequest): Promise<StoreDTO> => {
    const res = await apiClient.post<ApiResponse<StoreDTO>>("/merchant/stores", payload);
    return res.data?.data || (res.data as unknown as StoreDTO);
  },

  // Update Store Branch (Address, Hours, Coordinates)
  updateStore: async (id: string, payload: UpdateStoreRequest): Promise<StoreDTO> => {
    const res = await apiClient.put<ApiResponse<StoreDTO>>(`/merchant/stores/${id}`, payload);
    return res.data?.data || (res.data as unknown as StoreDTO);
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

  // Admin: List All Stores Across Merchants
  getAllStoresAdmin: async (params?: PaginationParams & { cityId?: string; status?: string }): Promise<PaginatedResponse<StoreDTO>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StoreDTO>>>("/admin/stores", { params });
    return res.data?.data || (res.data as unknown as PaginatedResponse<StoreDTO>);
  },

  // Admin: Approve Store Branch
  approveStoreAdmin: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/approve`);
  },

  // Admin: Reject Store Branch
  rejectStoreAdmin: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/stores/${id}/reject`, { reason });
  },

  // PostGIS Discovery Test (Radius Search)
  getNearbyStores: async (lat: number, lng: number, radiusMeters: number = 5000): Promise<StoreDTO[]> => {
    const res = await apiClient.get<ApiResponse<StoreDTO[]>>("/discovery/nearby", {
      params: { lat, lng, radius: radiusMeters },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },
};
