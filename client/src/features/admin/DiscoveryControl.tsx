import React, { useState } from "react";
import {
  MapPin,
  Compass,
  Sliders,
  Filter,
  Layers,
  Sparkles,
  TicketPercent,
  Navigation,
  Database,
  Search
} from "lucide-react";
import { Store, Offer } from "../../types";
import { MapView } from "../../components/Map";

interface DiscoveryControlProps {
  stores: Store[];
  offers: Offer[];
}

// Great-circle distance helper (Haversine formula in meters)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const DiscoveryControl: React.FC<DiscoveryControlProps> = ({ stores, offers }) => {
  // Preset GPS points
  const PRESET_CITIES = [
    { name: "Nagpur (Dharampeth Center)", lat: 21.1458, lng: 79.0882 },
    { name: "Pune (FC Road Lounge)", lat: 18.5204, lng: 73.8567 },
    { name: "Mumbai (Bandra West)", lat: 19.0600, lng: 72.8362 }
  ];

  const [currentLat, setCurrentLat] = useState(21.1458);
  const [currentLng, setCurrentLng] = useState(79.0882);
  const [radiusMeters, setRadiusMeters] = useState(5000); // 5km
  const [hasOfferOnly, setHasOfferOnly] = useState(false);

  // Compute nearby stores with distance
  const calculatedStores = stores
    .map((store) => {
      const distance = getDistanceMeters(currentLat, currentLng, store.latitude, store.longitude);
      const storeOffers = offers.filter(
        (o) => o.merchantId === store.merchantId && o.status === "ACTIVE"
      );
      return {
        ...store,
        distanceMeters: distance,
        distanceKm: (distance / 1000).toFixed(2),
        activeOffers: storeOffers
      };
    })
    .filter((store) => {
      const withinRadius = store.distanceMeters <= radiusMeters;
      const offerMatch = !hasOfferOnly || store.activeOffers.length > 0;
      return withinRadius && offerMatch && store.status === "ACTIVE";
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Location-First Discovery Simulator
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
              PostGIS ST_DWithin Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulates mobile GPS coordinates and verifies radius ranking before results reach the React Native app.
          </p>
        </div>
      </div>

      {/* Simulator Controls Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Preset Location Picker */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Test Customer Location
            </label>
            <select
              onChange={(e) => {
                const found = PRESET_CITIES.find((c) => c.name === e.target.value);
                if (found) {
                  setCurrentLat(found.lat);
                  setCurrentLng(found.lng);
                }
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {PRESET_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exact Coordinates */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Simulated Coordinates (Lat / Lng)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={currentLat}
                onChange={(e) => setCurrentLat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <input
                type="number"
                step="any"
                value={currentLng}
                onChange={(e) => setCurrentLng(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Radius Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
              <span>Search Radius</span>
              <span className="text-pink-600 dark:text-pink-400 font-extrabold font-mono">
                {(radiusMeters / 1000).toFixed(1)} km ({radiusMeters}m)
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="15000"
              step="500"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
              className="w-full accent-pink-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Filter chips & SQL query preview */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasOfferOnly}
              onChange={(e) => setHasOfferOnly(e.target.checked)}
              className="rounded-md accent-pink-600"
            />
            <span>Filter stores with Active Offers only</span>
          </label>

          <span className="text-xs font-bold text-slate-500">
            Matching Active Stores:{" "}
            <strong className="text-pink-600 dark:text-pink-400 text-sm">
              {calculatedStores.length}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Discovery Map & Results List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
              Ranked Stores Nearby
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Sorted by Distance
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {calculatedStores.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No stores within {(radiusMeters / 1000).toFixed(1)} km. Expand the radius slider above.
              </div>
            ) : (
              calculatedStores.map((store, idx) => (
                <div
                  key={store.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-pink-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {store.branchName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {store.merchantName} · {store.city}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 shrink-0">
                      {store.distanceKm} km
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate">
                    {store.address}
                  </p>

                  {store.activeOffers.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <TicketPercent size={13} />
                      <span>{store.activeOffers[0].title}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map / PostGIS Spatial Visualizer */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                Spatial Radius & PostGIS Query Simulation
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ST_DWithin(ST_MakePoint(lng, lat), radius)
            </span>
          </div>

          {/* Interactive Map Visualizer */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[380px] bg-slate-900 flex items-center justify-center">
            <MapView
              key={`${currentLat}-${currentLng}-${radiusMeters}`}
              initialCenter={{ lat: currentLat, lng: currentLng }}
              initialZoom={12}
              className="w-full h-full"
              onMapReady={(map) => {
                // Add center user pin
                new google.maps.Marker({
                  map,
                  position: { lat: currentLat, lng: currentLng },
                  title: "Customer Device Location",
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: "#e00570",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3
                  }
                });

                // Add search radius circle
                new google.maps.Circle({
                  map,
                  center: { lat: currentLat, lng: currentLng },
                  radius: radiusMeters,
                  fillColor: "#6817c8",
                  fillOpacity: 0.12,
                  strokeColor: "#6817c8",
                  strokeOpacity: 0.6,
                  strokeWeight: 2
                });

                // Add stores
                calculatedStores.forEach((s) => {
                  new google.maps.Marker({
                    map,
                    position: { lat: s.latitude, lng: s.longitude },
                    title: `${s.branchName} (${s.distanceKm} km)`,
                    label: {
                      text: s.branchName[0],
                      color: "#fff",
                      fontWeight: "700"
                    }
                  });
                });
              }}
            />
          </div>

          {/* SQL Preview Banner */}
          <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
            <span className="text-purple-400">SELECT</span> id, store_name, branch_name, latitude, longitude{" "}
            <span className="text-purple-400">FROM</span> stores{" "}
            <span className="text-purple-400">WHERE</span> status = <span className="text-amber-400">&apos;ACTIVE&apos;</span>{" "}
            <span className="text-purple-400">AND</span> ST_DWithin(location, ST_SetSRID(ST_MakePoint({currentLng}, {currentLat}), 4326)::geography, {radiusMeters});
          </div>
        </div>
      </div>
    </div>
  );
};
