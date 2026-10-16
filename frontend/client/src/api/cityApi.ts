import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface OperatingCity {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
}

export interface PincodeLookupResult {
  pincode: string;
  state: string;
  district: string;
  city: string;
  availableDistricts: string[];
  availableCities: string[];
}

export const cityApi = {
  // Fetch active operating cities from discovery service (Public)
  async getOperatingCities(): Promise<OperatingCity[]> {
    const res = await apiClient.get<ApiResponse<OperatingCity[]>>("/discovery/cities");
    return res.data?.data || [];
  },

  // Get specific city details
  async getCityById(cityId: string): Promise<OperatingCity | null> {
    const res = await apiClient.get<ApiResponse<OperatingCity>>(`/discovery/cities/${cityId}`);
    return res.data?.data || null;
  },

  // Fast 6-digit Pincode lookup for State, District & City auto-fill
  async lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) return null;
    const res = await apiClient.get<ApiResponse<PincodeLookupResult>>(`/locations/pincode/${clean}`);
    return res.data?.data || null;
  },
};
