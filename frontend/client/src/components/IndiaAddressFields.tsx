import React, { useMemo } from "react";
import {
  getAllStates,
  getDistrictsForState,
  getCitiesForDistrictOrState
} from "../data/indiaLocations";
import { MapPin, Building, Globe2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

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
  // All pre-configured Indian states
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
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
            District *
          </label>
          <div className="relative">
            {availableDistricts.length > 0 ? (
              <select
                value={district}
                onChange={(e) => handleDistrictSelect(e.target.value)}
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
              </select>
            ) : (
              <input
                type="text"
                value={district}
                onChange={(e) => onDistrictChange(e.target.value)}
                placeholder="District Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            )}
            {availableDistricts.length > 0 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            )}
          </div>
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
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
            City / Locality *
          </label>
          <div className="relative">
            {availableCities.length > 0 ? (
              <select
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
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
              </select>
            ) : (
              <input
                type="text"
                list="india-city-suggestions"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="e.g. Nagpur"
                className={cn(
                  "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden transition-all",
                  errors.city
                    ? "border-rose-500 ring-1 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
              />
            )}
            {availableCities.length > 0 && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            )}
            <datalist id="india-city-suggestions">
              {availableCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct} ({district || state})
                </option>
              ))}
            </datalist>
          </div>
          {errors.city && (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.city}</span>
            </p>
          )}
        </div>

        {/* Pincode */}
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
            PIN Code *
          </label>
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
            placeholder="440010"
            className={cn(
              "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden transition-all",
              errors.pincode
                ? "border-rose-500 ring-1 ring-rose-500/20"
                : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
            )}
          />
          {errors.pincode && (
            <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle size={12} className="shrink-0" />
              <span>{errors.pincode}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
