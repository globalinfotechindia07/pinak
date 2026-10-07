import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface OperatingCity {
  id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
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
};
