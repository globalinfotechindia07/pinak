import React from "react";
import { DiscoveryLeafletMap, DiscoveryMapStoreItem } from "./DiscoveryLeafletMap";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  radiusMeters?: number;
  stores?: DiscoveryMapStoreItem[];
  height?: string;
}

/**
 * Standard Leaflet-powered MapView (Zero external Google Maps dependencies)
 */
export function MapView({
  className = "",
  initialCenter = { lat: 19.0760, lng: 72.8777 },
  radiusMeters = 5000,
  stores = [],
  height = "400px"
}: MapViewProps) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}>
      <DiscoveryLeafletMap
        center={initialCenter}
        radiusMeters={radiusMeters}
        stores={stores}
        height={height}
      />
    </div>
  );
}
