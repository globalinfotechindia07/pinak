import apiClient from "./client";
import {
  AdminOfferFilterParams,
  CreateOfferRequest,
  OfferDTO,
} from "../types/api/offer.dto";
import { ApiResponse, PaginatedResponse } from "../types/api/common";

export const offerApi = {
  // Admin: Fetch all platform offers with multi-parameter filtering
  getAdminOffers: async (params?: AdminOfferFilterParams): Promise<PaginatedResponse<OfferDTO>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<OfferDTO> | OfferDTO[]>>("/admin/offers", { params });
    if (Array.isArray(res.data?.data)) {
      return {
        content: res.data.data,
        totalElements: res.data.data.length,
        totalPages: 1,
        size: res.data.data.length,
        page: 0,
        last: true,
      };
    }
    return res.data?.data as PaginatedResponse<OfferDTO>;
  },

  // Admin: Get offer details by ID
  getAdminOfferById: async (offerId: string): Promise<OfferDTO> => {
    const res = await apiClient.get<ApiResponse<OfferDTO>>(`/admin/offers/${offerId}`);
    return res.data?.data || (res.data as unknown as OfferDTO);
  },

  // Admin: Approve pending offer
  approveOfferAdmin: async (offerId: string): Promise<void> => {
    await apiClient.patch(`/admin/offers/${offerId}/approve`);
  },

  // Admin: Reject offer with mandatory reason
  rejectOfferAdmin: async (offerId: string, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/offers/${offerId}/reject`, { reason });
  },

  // Admin: Suspend active offer campaign with mandatory reason
  suspendOfferAdmin: async (offerId: string, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/offers/${offerId}/suspend`, { reason });
  },

  // Merchant / Platform: Create campaign offer
  createOffer: async (payload: CreateOfferRequest): Promise<OfferDTO> => {
    const res = await apiClient.post<ApiResponse<OfferDTO>>("/merchant/offers", payload);
    return res.data?.data || (res.data as unknown as OfferDTO);
  },
};
