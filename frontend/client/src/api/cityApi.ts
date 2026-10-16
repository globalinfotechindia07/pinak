import apiClient from "./client";
import { ApiResponse } from "../types/api/common";
import { normalizeIndiaLocation, resolvePincodePrefixLocation, getDistrictsForState, getCitiesForDistrictOrState } from "../data/indiaLocations";

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

  // Fast 6-digit Pincode lookup (Authoritative Live Third-Party India Post API + resilient multi-tier fallback)
  async lookupPincode(pincode: string): Promise<PincodeLookupResult | null> {
    const clean = pincode.replace(/\D/g, "");
    if (clean.length !== 6) return null;

    // 1. Primary: Official Live India Post Third-Party Public API (Accurate & Authoritative)
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${clean}`, {
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json) && json.length > 0) {
          const item = json[0];
          if (item.Status === "Success" && Array.isArray(item.PostOffice) && item.PostOffice.length > 0) {
            const firstPo = item.PostOffice[0];
            const rawState = firstPo.State || "";
            const rawDistrict = firstPo.District || "";
            const block = firstPo.Block && firstPo.Block !== "NA" ? firstPo.Block : "";
            const rawCity = block || firstPo.District || firstPo.Name || "";

            const norm = normalizeIndiaLocation(rawState, rawDistrict, rawCity);
            const postOffices = item.PostOffice.map((p: any) => p.Name).filter(Boolean);

            return {
              pincode: clean,
              state: norm.state,
              district: norm.district,
              city: norm.city,
              availableDistricts: norm.availableDistricts,
              availableCities: norm.availableCities.length > 0 ? norm.availableCities : postOffices,
              isDistrictCustom: norm.isDistrictCustom,
              isCityCustom: norm.isCityCustom,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Live India Post third-party API failed, falling back:", err);
    }

    // 2. Secondary: Zippopotam.us India Public API
    try {
      const response = await fetch(`https://api.zippopotam.us/in/${clean}`);
      if (response.ok) {
        const json = await response.json();
        if (json.places && json.places.length > 0) {
          const place = json.places[0];
          const rawState = place.state || "";
          const rawCity = place["place name"] || "";
          const norm = normalizeIndiaLocation(rawState, undefined, rawCity);
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
      }
    } catch (err) {
      // Secondary third-party API offline or failed
    }

    // 3. Tertiary: Backend Proxy API
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
      // Backend may be unreachable
    }

    // 4. Quaternary: Local Offline Dataset (Zero-Network fallback)
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
      console.warn("Local pincode check failed:", err);
    }

    // 5. Ultimate Fallback: Official India Postal Circle & Sub-Region Prefix Inference
    const prefixFallback = resolvePincodePrefixLocation(clean);
    if (prefixFallback) {
      const norm = normalizeIndiaLocation(prefixFallback.state, prefixFallback.district, prefixFallback.city);
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

    return null;
  },
};
