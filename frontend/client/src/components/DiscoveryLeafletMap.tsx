import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Store, Offer } from "../types";

export interface DiscoveryMapStoreItem extends Store {
  distanceMeters: number;
  distanceKm: string;
  activeOffers: Offer[];
  merchantRating: number;
  discoveryScore: number;
  isBoosted?: boolean;
  boostRank?: number;
}

interface DiscoveryLeafletMapProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  stores: DiscoveryMapStoreItem[];
  onCenterChange?: (lat: number, lng: number) => void;
  onSelectStore?: (store: DiscoveryMapStoreItem) => void;
  className?: string;
  height?: string;
}

// Custom customer GPS marker with pulsing halo
const createCustomerPinIcon = () => {
  return L.divIcon({
    className: "custom-customer-pin",
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(224, 5, 112, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 18px; height: 18px; border-radius: 50%; background: #e00570; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(224, 5, 112, 0.5); z-index: 10;"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
};

// Custom numbered store marker with luxury badge
const createStorePinIcon = (index: number, isBoosted: boolean, branchName: string) => {
  const bgColor = isBoosted ? "#e00570" : "#6817c8";
  return L.divIcon({
    className: `custom-store-marker-${index}`,
    html: `
      <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
        <div style="background: ${bgColor}; color: #ffffff; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
          ${index + 1}
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${bgColor};"></div>
      </div>
    `,
    iconSize: [30, 36],
    iconAnchor: [15, 34],
    popupAnchor: [0, -32],
  });
};

export const DiscoveryLeafletMap: React.FC<DiscoveryLeafletMapProps> = ({
  center,
  radiusMeters,
  stores,
  onCenterChange,
  onSelectStore,
  className = "",
  height = "420px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const storesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: radiusMeters > 15000 ? 11 : radiusMeters > 8000 ? 12 : 13,
      zoomControl: false,
    });

    // Clean OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a>",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Search Radius Geofence Circle
    const circle = L.circle([center.lat, center.lng], {
      radius: radiusMeters,
      color: "#e00570",
      weight: 2,
      opacity: 0.8,
      fillColor: "#6817c8",
      fillOpacity: 0.12,
      dashArray: "6, 8",
    }).addTo(map);
    circleRef.current = circle;

    // Customer GPS Location Marker
    const customerMarker = L.marker([center.lat, center.lng], {
      icon: createCustomerPinIcon(),
      zIndexOffset: 1000,
    }).addTo(map);
    customerMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; padding: 2px;">
        <strong style="color: #e00570; display: block;">📍 Customer Search Location</strong>
        <span style="color: #64748B;">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</span>
      </div>
    `);
    customerMarkerRef.current = customerMarker;

    // Stores Layer Group
    const storesLayer = L.layerGroup().addTo(map);
    storesLayerGroupRef.current = storesLayer;

    // Interactive Map Click to update Customer Location
    map.on("click", (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      if (onCenterChange) {
        onCenterChange(lat, lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Center and Radius Smoothly without destroying Map instance
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (circleRef.current) {
      circleRef.current.setLatLng([center.lat, center.lng]);
      circleRef.current.setRadius(radiusMeters);
    }

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([center.lat, center.lng]);
      customerMarkerRef.current.setPopupContent(`
        <div style="font-family: inherit; font-size: 11px; padding: 2px;">
          <strong style="color: #e00570; display: block;">📍 Customer Search Location</strong>
          <span style="color: #64748B;">${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}</span>
        </div>
      `);
    }

    // Pan smoothly to new center
    mapInstanceRef.current.panTo([center.lat, center.lng], { animate: true, duration: 0.6 });
  }, [center.lat, center.lng, radiusMeters]);

  // Update Store Markers Layer Group
  useEffect(() => {
    if (!storesLayerGroupRef.current) return;

    storesLayerGroupRef.current.clearLayers();

    stores.forEach((st, idx) => {
      if (!st.latitude || !st.longitude) return;

      const marker = L.marker([st.latitude, st.longitude], {
        icon: createStorePinIcon(idx, !!st.isBoosted, st.branchName),
      });

      const offerText = st.activeOffers.length > 0
        ? `<div style="margin-top: 4px; padding: 3px 6px; background: #ecfdf5; color: #047857; border-radius: 6px; font-weight: 700; font-size: 10px;">🏷️ ${st.activeOffers[0].title}</div>`
        : `<div style="margin-top: 4px; color: #94a3b8; font-size: 10px;">No active deals</div>`;

      const popupHtml = `
        <div style="font-family: inherit; font-size: 11px; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong style="color: #0f172a; font-size: 12px; display: block;">${st.storeName || st.branchName}</strong>
            <span style="background: #fdf2f8; color: #be185d; padding: 1px 6px; border-radius: 9999px; font-weight: 800; font-size: 10px;">${st.distanceKm} km</span>
          </div>
          <p style="color: #64748b; font-size: 10px; margin: 2px 0 0 0;">${st.merchantName} · ${st.city}</p>
          ${offerText}
          <div style="margin-top: 6px; text-align: right;">
            <button id="inspect-store-${st.id}" style="background: #7c3aed; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer;">
              Inspect Outlet &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`inspect-store-${st.id}`);
        if (btn && onSelectStore) {
          btn.onclick = () => onSelectStore(st);
        }
      });

      marker.on("click", () => {
        if (onSelectStore) {
          onSelectStore(st);
        }
      });

      storesLayerGroupRef.current?.addLayer(marker);
    });
  }, [stores, onSelectStore]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ${className}`}>
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

      {/* Floating GPS HUD */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-white px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        <span>
          Customer GPS: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </span>
      </div>

      {/* Radius Indicator & Click Hint */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 shadow-sm">
        <span>Radius: <strong className="text-pink-600 dark:text-pink-400">{(radiusMeters / 1000).toFixed(1)} km</strong></span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className="text-slate-400">Click map anywhere to relocate pin</span>
      </div>
    </div>
  );
};
