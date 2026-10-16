import React, { useMemo, useState } from "react";
import {
  getAllStates,
  getDistrictsForState,
  getCitiesForDistrictOrState
} from "../data/indiaLocations";
import { MapPin, Building, Globe2, AlertCircle, Check, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { cityApi } from "../api/cityApi";

export interface IndiaAddressFieldsProps {
  state: string;
  district: string;
  city: string;
  pincode: string;
  address: string;
  errors?: Record<string, string>;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onCityChange: (city: string) => void;
  onPincodeChange: (pincode: string) => void;
  onAddressChange: (address: string) => void;
  className?: string;
}

export const IndiaAddressFields: React.FC<IndiaAddressFieldsProps> = ({
  state,
  district,
  city,
  pincode,
  address,
  errors = {},
  onStateChange,
  onDistrictChange,
  onCityChange,
  onPincodeChange,
  onAddressChange,
  className = ""
}) => {
  const [isCustomDistrict, setIsCustomDistrict] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState<string | null>(null);

  // All pre-configured Indian states (all 36 States/UTs)
  const states = useMemo(() => getAllStates(), []);

  // Districts for currently selected state
  const availableDistricts = useMemo(() => {
    return getDistrictsForState(state);
  }, [state]);

  // Cities for currently selected district and state
  const availableCities = useMemo(() => {
    return getCitiesForDistrictOrState(state, district);
  }, [state, district]);

  const handleStateSelect = (newState: string) => {
    onStateChange(newState);
    const districtsForNewState = getDistrictsForState(newState);
    const newDistrict = districtsForNewState.length > 0 ? districtsForNewState[0] : "";
    onDistrictChange(newDistrict);
    const citiesForNewDistrict = getCitiesForDistrictOrState(newState, newDistrict);
    if (citiesForNewDistrict.length > 0) {
      onCityChange(citiesForNewDistrict[0]);
    }
  };

  const handleDistrictSelect = (newDistrict: string) => {
    onDistrictChange(newDistrict);
    const citiesForDistrict = getCitiesForDistrictOrState(state, newDistrict);
    if (citiesForDistrict.length > 0 && !citiesForDistrict.includes(city)) {
      onCityChange(citiesForDistrict[0]);
    }
  };

  const handlePincodeInput = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    onPincodeChange(clean);

    if (clean.length === 6) {
      try {
        setIsLookingUpPincode(true);
        const res = await cityApi.lookupPincode(clean);
        if (res && res.state) {
          onStateChange(res.state);
          if (res.district) onDistrictChange(res.district);
          if (res.city) onCityChange(res.city);
          setPincodeSuccess(`Auto-filled: ${res.city || res.district}, ${res.state}`);
          setTimeout(() => setPincodeSuccess(null), 4000);
        }
      } catch (err) {
        console.warn("Pincode lookup error:", err);
      } finally {
        setIsLookingUpPincode(false);
      }
    }
  };

  return (
    <div className={cn("space-y-3.5", className)}>
      {/* Street Address */}
      <div>
        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
          Street / Shop Address *
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="e.g. Shop 12, Ground Floor, Mount Road..."
          className={cn(
            "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden transition-all",
            errors.address
              ? "border-rose-500 ring-1 ring-rose-500/20"
              : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
          )}
        />
        {errors.address && (
          <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
            <AlertCircle size={12} className="shrink-0" />
            <span>{errors.address}</span>
          </p>
        )}
      </div>

      {/* State & District Dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        {/* State */}
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
            State *
          </label>
          <div className="relative">
            <select
              value={state}
              onChange={(e) => handleStateSelect(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden transition-all",
                errors.state
                  ? "border-rose-500 ring-1 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
              )}
            >
              <option value="" disabled>Select State</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
          {errors.state && (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.state}</span>
            </p>
          )}
        </div>

        {/* District */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              District *
            </label>
            <button
              type="button"
              onClick={() => setIsCustomDistrict(!isCustomDistrict)}
              className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              {isCustomDistrict ? "← Choose from list" : "Type custom district"}
            </button>
          </div>
          {isCustomDistrict ? (
            <input
              type="text"
              value={district}
              onChange={(e) => onDistrictChange(e.target.value)}
              placeholder="District Name"
              className={cn(
                "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden",
                errors.district
                  ? "border-rose-500 ring-1 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
              )}
            />
          ) : (
            <div className="relative">
              <select
                value={district}
                onChange={(e) => {
                  if (e.target.value === "__CUSTOM__") {
                    setIsCustomDistrict(true);
                  } else {
                    handleDistrictSelect(e.target.value);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden transition-all",
                  errors.district
                    ? "border-rose-500 ring-1 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
              >
                <option value="">Select District</option>
                {availableDistricts.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Other (Type custom district...)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          )}
          {errors.district && (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.district}</span>
            </p>
          )}
        </div>
      </div>

      {/* City & Pincode */}
      <div className="grid grid-cols-2 gap-3">
        {/* City / Locality Dropdown with Search & Custom Input Support */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              City / Locality *
            </label>
            <button
              type="button"
              onClick={() => setIsCustomCity(!isCustomCity)}
              className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
            >
              {isCustomCity ? "← Choose from list" : "Type custom city"}
            </button>
          </div>
          {isCustomCity ? (
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. Nagpur / Ramdaspeth"
              className={cn(
                "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden transition-all",
                errors.city
                  ? "border-rose-500 ring-1 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
              )}
            />
          ) : (
            <div className="relative">
              <select
                value={city}
                onChange={(e) => {
                  if (e.target.value === "__CUSTOM__") {
                    setIsCustomCity(true);
                  } else {
                    onCityChange(e.target.value);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden transition-all",
                  errors.city
                    ? "border-rose-500 ring-1 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
              >
                <option value="" disabled>Select City / Locality</option>
                {availableCities.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Other (Type custom city...)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          )}
          {errors.city && (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.city}</span>
            </p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              PIN Code *
            </label>
            {isLookingUpPincode && (
              <span className="text-[10px] text-purple-600 animate-pulse font-semibold">Detecting...</span>
            )}
          </div>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => handlePincodeInput(e.target.value)}
            placeholder="440010"
            className={cn(
              "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden transition-all",
              errors.pincode
                ? "border-rose-500 ring-1 ring-rose-500/20"
                : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
            )}
          />
          {errors.pincode ? (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.pincode}</span>
            </p>
          ) : pincodeSuccess ? (
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <Check size={11} /> {pincodeSuccess}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-0.5">Auto-fills State & District</p>
          )}
        </div>
      </div>
    </div>
  );
};
