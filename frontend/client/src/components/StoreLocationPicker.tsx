import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Search,
  Crosshair,
  Loader2,
  Check,
  Building2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { matchIndiaLocation } from "../data/indiaLocations";

export interface GeoLocationHint {
  formattedAddress?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
}

interface StoreLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, locationHint?: GeoLocationHint) => void;
  city?: string;
  state?: string;
  storeName?: string;
  height?: string;
  className?: string;
}

// City presets across India for quick jumping
const POPULAR_CITIES = [
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.2090, state: "Delhi (NCT)" },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
];

export const StoreLocationPicker: React.FC<StoreLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  city,
  state,
  storeName,
  height = "320px",
  className = ""
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // Custom luxury SVG Pin icon
  const createPinIcon = () => {
    return L.divIcon({
      className: "custom-store-pin",
      html: `
        <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 12px rgba(124, 58, 237, 0.45));">
            <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 18 44 18 44C18 44 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="url(#pin_gradient)"/>
            <circle cx="18" cy="17" r="7" fill="white"/>
            <circle cx="18" cy="17" r="3.5" fill="#7C3AED"/>
            <defs>
              <linearGradient id="pin_gradient" x1="0" y1="0" x2="36" y2="44" gradientUnits="userSpaceOnUse">
                <stop stop-color="#9333EA"/>
                <stop offset="1" stop-color="#4F46E5"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
      popupAnchor: [0, -42],
    });
  };

  // Reverse Geocoding via OpenStreetMap Nominatim with Indian State/District match
  const reverseGeocode = async (lat: number, lng: number): Promise<GeoLocationHint | undefined> => {
    try {
      setIsResolvingAddress(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const matched = matchIndiaLocation({
          state: addr.state,
          district: addr.county || addr.state_district,
          city: addr.city || addr.town || addr.village || addr.suburb
        });

        return {
          formattedAddress: data.display_name,
          state: matched.matchedState || addr.state,
          district: matched.matchedDistrict || addr.county || addr.state_district,
          city: matched.matchedCity || addr.city || addr.town || addr.village,
          pincode: addr.postcode
        };
      }
    } catch (err) {
      console.warn("Reverse geocode notice:", err);
    } finally {
      setIsResolvingAddress(false);
    }
    return undefined;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = Number.isFinite(latitude) && latitude !== 0 ? latitude : 21.1458;
    const initialLng = Number.isFinite(longitude) && longitude !== 0 ? longitude : 79.0882;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // Elegant OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Zoom controls at top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Interactive draggable marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createPinIcon(),
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; padding: 2px;">
        <strong style="color: #7C3AED; display: block; margin-bottom: 2px;">📍 ${storeName || "Store Location"}</strong>
        <span style="color: #64748B;">Drag or click map to adjust</span>
      </div>
    `);

    // Handle marker drag
    marker.on("dragend", async () => {
      const position = marker.getLatLng();
      const lat = Number(position.lat.toFixed(6));
      const lng = Number(position.lng.toFixed(6));
      const hint = await reverseGeocode(lat, lng);
      onChange(lat, lng, hint);
    });

    // Handle click on map to move marker
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const formattedLat = Number(lat.toFixed(6));
      const formattedLng = Number(lng.toFixed(6));
      marker.setLatLng([formattedLat, formattedLng]);
      const hint = await reverseGeocode(formattedLat, formattedLng);
      onChange(formattedLat, formattedLng, hint);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sync external coordinate changes to marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const currentPos = markerRef.current.getLatLng();
      const diffLat = Math.abs(currentPos.lat - latitude);
      const diffLng = Math.abs(currentPos.lng - longitude);
      if (diffLat > 0.0001 || diffLng > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  // Center on city if provided
  useEffect(() => {
    if (!city || !mapInstanceRef.current) return;
    const matchedCity = POPULAR_CITIES.find(
      (c) => c.name.toLowerCase() === city.toLowerCase()
    );
    if (matchedCity) {
      mapInstanceRef.current.flyTo([matchedCity.lat, matchedCity.lng], 13);
    }
  }, [city]);

  // Device Geolocation (GPS)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          const formattedLat = Number(lat.toFixed(6));
          const formattedLng = Number(lng.toFixed(6));
          markerRef.current.setLatLng([formattedLat, formattedLng]);
          mapInstanceRef.current.flyTo([formattedLat, formattedLng], 16);
          const hint = await reverseGeocode(formattedLat, formattedLng);
          onChange(formattedLat, formattedLng, hint);
          toast.success("Detected your current GPS location!");
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation lookup notice:", err.message);
        toast.error("Could not obtain GPS coordinates. Please click directly on the map.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search locality / street using OpenStreetMap Nominatim
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const locationContext = [city, state, "India"].filter(Boolean).join(", ");
      const query = `${searchQuery.trim()}, ${locationContext}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        if (mapInstanceRef.current && markerRef.current) {
          const formattedLat = Number(newLat.toFixed(6));
          const formattedLng = Number(newLng.toFixed(6));
          markerRef.current.setLatLng([formattedLat, formattedLng]);
          mapInstanceRef.current.flyTo([formattedLat, formattedLng], 16);

          const addr = result.address || {};
          const matched = matchIndiaLocation({
            state: addr.state,
            district: addr.county || addr.state_district,
            city: addr.city || addr.town || addr.village || addr.suburb
          });

          const hint: GeoLocationHint = {
            formattedAddress: result.display_name,
            state: matched.matchedState || addr.state,
            district: matched.matchedDistrict || addr.county || addr.state_district,
            city: matched.matchedCity || addr.city || addr.town || addr.village,
            pincode: addr.postcode
          };

          onChange(formattedLat, formattedLng, hint);
          toast.success(`Centered on "${result.display_name.split(",")[0]}"`);
        }
      } else {
        toast.error("Location not found. Try entering a nearby landmark or locality.");
      }
    } catch (err: any) {
      console.warn("Address search notice:", err.message);
      toast.error("Address search service unavailable. Please select location directly on the map.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCityPreset = async (preset: (typeof POPULAR_CITIES)[0]) => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng]);
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13);
      const hint = await reverseGeocode(preset.lat, preset.lng);
      onChange(preset.lat, preset.lng, hint || { city: preset.name, state: preset.state });
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search Bar + Quick Locate */}
      <div className="flex gap-1.5 items-center">
        <form onSubmit={handleSearchAddress} className="flex-1 relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search landmark, street, or area..."
            className="w-full pl-8 pr-20 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 transition-colors shadow-2xs"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 transition-colors"
          >
            {isSearching ? <Loader2 size={12} className="animate-spin" /> : "Search"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLocating}
          title="Use My Current GPS Location"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 transition-colors flex items-center gap-1 text-xs shrink-0 shadow-2xs font-medium"
        >
          {isLocating ? (
            <Loader2 size={14} className="animate-spin text-purple-600" />
          ) : (
            <Crosshair size={14} className="text-purple-600" />
          )}
          <span className="hidden sm:inline">Locate Me</span>
        </button>
      </div>

      {/* Popular City Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-slate-400 shrink-0 text-[10px] font-medium uppercase tracking-wider">
          Quick Jump:
        </span>
        {POPULAR_CITIES.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => handleSelectCityPreset(c)}
            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-600 dark:text-slate-300 hover:text-purple-700 transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Interactive Map Canvas */}
      <div
        className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Coordinate Badge & Loading Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-1000">
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-[10px] border border-white/10 flex items-center gap-1.5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Lat: {Number(latitude).toFixed(5)}</span>
            <span className="text-slate-400">|</span>
            <span>Lng: {Number(longitude).toFixed(5)}</span>
          </div>

          {isResolvingAddress && (
            <div className="bg-purple-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[10px] border border-purple-400/30 flex items-center gap-1 shadow-md">
              <Loader2 size={11} className="animate-spin text-purple-300" />
              <span>Matching State & District...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
