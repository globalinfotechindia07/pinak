import apiClient from "./client";
import { ApiResponse } from "../types/api/common";
import { HomeBanner } from "../types";

export interface CreateBannerPayload {
  title: string;
  subtitle?: string;
  badgeText: string;
  imageUrl?: string;
  ctaText?: string;
  ctaAction?: string;
  ctaTargetId?: string;
  themeStyle?: string;
  displayOrder?: number;
  countdownEndTime?: string;
  isActive?: boolean;
}

export interface UpdateBannerPayload extends Partial<CreateBannerPayload> {}

export const bannerApi = {
  // Public / Mobile: Get active hero promotional banners
  getActiveBanners: async (placement = "DISCOVER"): Promise<HomeBanner[]> => {
    try {
      const res = await apiClient.get<ApiResponse<{ banners: HomeBanner[] } | HomeBanner[]>>("/banners", {
        params: { placement }
      });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "banners" in data && Array.isArray(data.banners)) return data.banners;
      return [];
    } catch (err) {
      console.warn("Failed to fetch active banners from backend:", err);
      return [];
    }
  },

  // Admin: List all banners
  getAllBanners: async (): Promise<HomeBanner[]> => {
    const res = await apiClient.get<ApiResponse<HomeBanner[]>>("/admin/banners");
    return res.data?.data || [];
  },

  // Admin: Create banner
  createBanner: async (payload: CreateBannerPayload): Promise<HomeBanner> => {
    const res = await apiClient.post<ApiResponse<HomeBanner>>("/admin/banners", payload);
    return res.data?.data;
  },

  // Admin: Update banner
  updateBanner: async (id: string, payload: UpdateBannerPayload): Promise<HomeBanner> => {
    const res = await apiClient.put<ApiResponse<HomeBanner>>(`/admin/banners/${id}`, payload);
    return res.data?.data;
  },

  // Admin: Delete banner
  deleteBanner: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/banners/${id}`);
  },

  // Admin: Toggle active status
  toggleBannerStatus: async (id: string): Promise<HomeBanner> => {
    const res = await apiClient.patch<ApiResponse<HomeBanner>>(`/admin/banners/${id}/toggle`);
    return res.data?.data;
  }
};
