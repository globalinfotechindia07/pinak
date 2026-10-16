import apiClient from "./client";
import { ApiResponse } from "../types/api/common";
import { normalizeIndiaLocation, getDistrictsForState, getCitiesForDistrictOrState } from "../data/indiaLocations";

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
  isDistrictCustom?: boolean;
  isCityCustom?: boolean;
}

type PincodeRecord = {
  state: string;
  district: string;
  city: string;
  postOffices?: string[];
};

let localPincodeCache: Record<string, PincodeRecord> | null = null;
let loadPromise: Promise<Record<string, PincodeRecord>> | null = null;

const getLocalPincodeData = async (): Promise<Record<string, PincodeRecord>> => {
  if (localPincodeCache) return localPincodeCache;
  if (!loadPromise) {
    loadPromise = import("../data/pincode_lookup.json")
      .then((mod) => {
        localPincodeCache = (mod.default || mod) as Record<string, PincodeRecord>;
        return localPincodeCache;
      })
      .catch((err) => {
        console.warn("Failed to load local pincode directory chunk:", err);
        return {};
      });
  }
  return loadPromise;
};

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

  // Fast 6-digit Pincode lookup (instant local resolution + backend fallback)
  async lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) return null;

    // 1. Try local bundled dataset (sub-millisecond, offline & independent of backend auth)
    try {
      const data = await getLocalPincodeData();
      const match = data[clean];
      if (match && match.state) {
        const norm = normalizeIndiaLocation(match.state, match.district, match.city);
        return {
          pincode: clean,
          state: norm.state,
          district: norm.district,
          city: norm.city,
          availableDistricts: norm.availableDistricts,
          availableCities: norm.availableCities,
          isDistrictCustom: norm.isDistrictCustom,
          isCityCustom: norm.isCityCustom,
        };
      }
    } catch (err) {
      console.warn("Local pincode check failed, trying backend:", err);
    }

    // 2. Try Backend Discovery API
    try {
      const res = await apiClient.get<ApiResponse<PincodeLookupResult>>(`/locations/pincode/${clean}`);
      if (res.data?.data?.state) {
        const d = res.data.data;
        const norm = normalizeIndiaLocation(d.state, d.district, d.city);
        return {
          ...d,
          state: norm.state,
          district: norm.district,
          city: norm.city,
          availableDistricts: norm.availableDistricts,
          availableCities: norm.availableCities,
          isDistrictCustom: norm.isDistrictCustom,
          isCityCustom: norm.isCityCustom,
        };
      }
    } catch (err) {
      // Backend may be offline or unauthorized
    }

    return null;
  },
};
