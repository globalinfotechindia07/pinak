import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../types/api/common";

export interface OperatingCity {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  status?: "ACTIVE" | "INACTIVE";
  latitude?: number;
  longitude?: number;
  serviceRadiusMeters?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCityPayload {
  name: string;
  slug: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusMeters?: number;
}

export interface NearbyStoreResult {
  id: string;
  merchantId: string;
  merchantName: string;
  name: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  distanceMeters: number;
  hasActiveOffers: boolean;
}

export interface GlobalSearchResult {
  query: string;
  totalResults: number;
  stores?: Array<{
    id: string;
    name: string;
    merchantName?: string;
    categoryName?: string;
    address?: string;
    distanceMeters?: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    slug?: string;
    storeCount?: number;
  }>;
  offers?: Array<{
    id: string;
    title: string;
    merchantName?: string;
    discountType?: string;
    value?: number;
  }>;
}

export const discoveryApi = {
  // Public active cities for mobile / discovery
  async getDiscoveryCities(): Promise<OperatingCity[]> {
    try {
      const res = await apiClient.get<ApiResponse<OperatingCity[]>>("/discovery/cities");
      return res.data?.data || [];
    } catch (err) {
      console.warn("[Discovery API] Failed to fetch discovery cities:", err);
      return [];
    }
  },

  // Admin Master Data: All Cities
  async getAllAdminCities(): Promise<OperatingCity[]> {
    try {
      const res = await apiClient.get<ApiResponse<OperatingCity[]>>("/admin/cities");
      return res.data?.data || [];
    } catch (err) {
      console.warn("[Discovery API] Failed to fetch admin cities:", err);
      return [];
    }
  },

  // Admin: Create new operating city
  async createCity(payload: CreateCityPayload): Promise<OperatingCity> {
    const res = await apiClient.post<ApiResponse<OperatingCity>>("/admin/cities", {
      name: payload.name.trim(),
      slug: payload.slug.trim().toLowerCase(),
      state: payload.state.trim(),
      country: payload.country?.trim() || "India",
    });
    return res.data?.data;
  },

  // Admin: Update city details
  async updateCity(cityId: string, payload: Partial<CreateCityPayload>): Promise<OperatingCity> {
    const res = await apiClient.put<ApiResponse<OperatingCity>>(`/admin/cities/${cityId}`, payload);
    return res.data?.data;
  },

  // Admin: Toggle city status
  async updateCityStatus(cityId: string, status: "ACTIVE" | "INACTIVE"): Promise<OperatingCity> {
    const res = await apiClient.patch<ApiResponse<OperatingCity>>(`/admin/cities/${cityId}/status`, { status });
    return res.data?.data;
  },

  // Admin: Deactivate city
  async deactivateCity(cityId: string): Promise<void> {
    await apiClient.delete(`/admin/cities/${cityId}`);
  },

  // Live PostGIS Nearby Stores API
  async getNearbyStores(params: {
    lat: number;
    lng: number;
    radius?: number;
    categoryId?: string;
    hasOffer?: boolean;
    isOpen?: boolean;
    sort?: "distance" | "name";
  }): Promise<{ stores: NearbyStoreResult[]; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await apiClient.get<ApiResponse<NearbyStoreResult[]>>("/discovery/nearby", {
        params: {
          lat: params.lat,
          lng: params.lng,
          radius: params.radius || 5000,
          categoryId: params.categoryId || undefined,
          hasOffer: params.hasOffer ?? false,
          isOpen: params.isOpen,
          sort: params.sort || "distance",
        },
      });
      const latencyMs = Math.round(performance.now() - start);
      return {
        stores: res.data?.data || [],
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      console.warn("[Discovery API] getNearbyStores fallback:", err);
      return { stores: [], latencyMs };
    }
  },

  // Global Multi-Entity Search API
  async globalSearch(params: {
    q: string;
    type?: "ALL" | "STORE" | "OFFER" | "CATEGORY";
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<{ result: GlobalSearchResult | null; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await apiClient.get<ApiResponse<GlobalSearchResult>>("/discovery/search/global", {
        params: {
          q: params.q,
          type: params.type || "ALL",
          lat: params.lat,
          lng: params.lng,
          radius: params.radius,
        },
      });
      const latencyMs = Math.round(performance.now() - start);
      return { result: res.data?.data || null, latencyMs };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      console.warn("[Discovery API] globalSearch error:", err);
      return { result: null, latencyMs };
    }
  },
};
