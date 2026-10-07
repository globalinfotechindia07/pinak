import React, { useState, useEffect, useMemo } from "react";
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
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Globe,
  Gauge,
  Zap,
  Clock,
  Star,
  Flame,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  Info,
  X,
  Radio,
  Server,
  Download,
  Upload
} from "lucide-react";
import { Store, Offer, Merchant, Category } from "../../types";
import { DiscoveryLeafletMap, DiscoveryMapStoreItem } from "../../components/DiscoveryLeafletMap";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { useAppStore } from "../../hooks/useAppStore";
import { discoveryApi, OperatingCity } from "../../api/discoveryApi";

interface DiscoveryControlProps {
  stores: Store[];
  offers: Offer[];
  merchants?: Merchant[];
  categories?: Category[];
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

// Default operating cities if none in store
const DEFAULT_CITIES: OperatingCity[] = [
  { id: "city-ngp", name: "Nagpur", slug: "nagpur", state: "Maharashtra", country: "India", status: "ACTIVE", latitude: 21.1458, longitude: 79.0882, serviceRadiusMeters: 25000 },
  { id: "city-pun", name: "Pune", slug: "pune", state: "Maharashtra", country: "India", status: "ACTIVE", latitude: 18.5204, longitude: 73.8567, serviceRadiusMeters: 30000 },
  { id: "city-mum", name: "Mumbai", slug: "mumbai", state: "Maharashtra", country: "India", status: "ACTIVE", latitude: 19.0760, longitude: 72.8777, serviceRadiusMeters: 35000 },
  { id: "city-blr", name: "Bengaluru", slug: "bengaluru", state: "Karnataka", country: "India", status: "ACTIVE", latitude: 12.9716, longitude: 77.5946, serviceRadiusMeters: 30000 },
  { id: "city-hyd", name: "Hyderabad", slug: "hyderabad", state: "Telangana", country: "India", status: "ACTIVE", latitude: 17.3850, longitude: 78.4867, serviceRadiusMeters: 28000 },
  { id: "city-del", name: "Delhi NCR", slug: "delhi-ncr", state: "Delhi", country: "India", status: "ACTIVE", latitude: 28.6139, longitude: 77.2090, serviceRadiusMeters: 40000 },
];

export const DiscoveryControl: React.FC<DiscoveryControlProps> = ({
  stores: propStores,
  offers: propOffers,
  merchants: propMerchants,
  categories: propCategories,
}) => {
  const store = useAppStore();
  const stores = propStores || store.stores;
  const offers = propOffers || store.offers;
  const merchants = propMerchants || store.merchants;
  const categories = propCategories || store.categories;

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<"simulator" | "cities" | "curation" | "diagnostics">("simulator");

  // ==========================================
  // TAB 1: Simulator & PostGIS Visualizer State
  // ==========================================
  const [currentLat, setCurrentLat] = useState(21.1458);
  const [currentLng, setCurrentLng] = useState(79.0882);
  const [radiusMeters, setRadiusMeters] = useState(5000); // 5km
  const [hasOfferOnly, setHasOfferOnly] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedCityName, setSelectedCityName] = useState("Nagpur");
  const [isLocating, setIsLocating] = useState(false);
  const [queryMode, setQueryMode] = useState<"real_api" | "client_math">("real_api");
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [inspectStore, setInspectStore] = useState<DiscoveryMapStoreItem | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // ==========================================
  // TAB 2: Operating Cities Master Data State
  // ==========================================
  const [operatingCities, setOperatingCities] = useState<OperatingCity[]>(() => {
    const fromStore = store.operatingCities;
    if (fromStore && fromStore.length > 0) {
      return fromStore.map((c, i) => ({
        ...DEFAULT_CITIES[i % DEFAULT_CITIES.length],
        ...c,
        status: (((c as any).status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE"),
      }));
    }
    return DEFAULT_CITIES;
  });
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCitySlug, setNewCitySlug] = useState("");
  const [newCityState, setNewCityState] = useState("");
  const [newCityLat, setNewCityLat] = useState<string>("21.1458");
  const [newCityLng, setNewCityLng] = useState<string>("79.0882");
  const [newCityRadius, setNewCityRadius] = useState<string>("25000");

  // ==========================================
  // TAB 3: Feed Curation & Boost Rules State (PERSISTENT)
  // ==========================================
  const curationConfig = store.discoveryCuration || {
    featuredStoreIds: {},
    heroOfferId: "",
    rankingWeights: { distance: 45, discountValue: 30, rating: 15, popularity: 10 },
  };

  const [featuredStoreIds, setFeaturedStoreIds] = useState<Record<string, number>>(() => {
    if (curationConfig.featuredStoreIds && Object.keys(curationConfig.featuredStoreIds).length > 0) {
      return curationConfig.featuredStoreIds;
    }
    // Sensible defaults from available stores
    const initial: Record<string, number> = {};
    if (stores.length > 0) initial[stores[0].id] = 1;
    if (stores.length > 1) initial[stores[1].id] = 2;
    return initial;
  });

  const [heroOfferId, setHeroOfferId] = useState<string>(() => {
    return curationConfig.heroOfferId || offers[0]?.id || "";
  });

  const [weights, setWeights] = useState(() => {
    return curationConfig.rankingWeights || {
      distance: 45,
      discountValue: 30,
      rating: 15,
      popularity: 10,
    };
  });

  // ==========================================
  // TAB 4: Global Search Diagnostics State
  // ==========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"ALL" | "STORE" | "OFFER" | "CATEGORY">("ALL");
  const [searchLatency, setSearchLatency] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [remoteSearchResults, setRemoteSearchResults] = useState<any>(null);

  // Sync Cities from Backend API on mount
  useEffect(() => {
    let isMounted = true;
    discoveryApi.getAllAdminCities().then((cities) => {
      if (isMounted && cities && cities.length > 0) {
        setOperatingCities(cities);
        store.setOperatingCities(cities);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Use Browser Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setCurrentLat(lat);
        setCurrentLng(lng);
        setSelectedCityName("Custom Device GPS");
        toast.success(`Location set to your GPS: ${lat}, ${lng}`);
      },
      (err) => {
        setIsLocating(false);
        toast.error("Could not obtain device GPS. Defaulting to Nagpur.");
      },
      { timeout: 8000 }
    );
  };

  // Compute Nearby Stores with Haversine + Discovery Algorithm
  const calculatedStores: DiscoveryMapStoreItem[] = useMemo(() => {
    return stores
      .map((st) => {
        const distance = getDistanceMeters(currentLat, currentLng, st.latitude, st.longitude);
        const storeOffers = offers.filter(
          (o) => (o.storeId === st.id || o.merchantId === st.merchantId) && o.status === "ACTIVE"
        );
        const merchant = merchants.find((m) => m.id === st.merchantId);
        const rating = merchant?.rating || 4.2;

        const maxVal = storeOffers.reduce((acc, curr) => Math.max(acc, curr.value || 0), 0);

        // Discovery Score calculation
        const distScore = Math.max(0, 100 - (distance / (radiusMeters || 5000)) * 100);
        const discountScore = Math.min(100, maxVal * 2);
        const ratingScore = (rating / 5) * 100;
        const boostPriority = featuredStoreIds[st.id] || 0;
        const boostMultiplier = boostPriority > 0 ? 150 - boostPriority * 10 : 0;

        const totalScore = Math.round(
          (distScore * weights.distance +
            discountScore * weights.discountValue +
            ratingScore * weights.rating) /
            100 +
            boostMultiplier
        );

        return {
          ...st,
          distanceMeters: distance,
          distanceKm: (distance / 1000).toFixed(2),
          activeOffers: storeOffers,
          merchantRating: rating,
          discoveryScore: totalScore,
          isBoosted: boostPriority > 0,
          boostRank: boostPriority,
        };
      })
      .filter((st) => {
        const withinRadius = st.distanceMeters <= radiusMeters;
        const offerMatch = !hasOfferOnly || st.activeOffers.length > 0;
        const categoryMatch =
          selectedCategoryId === "ALL" ||
          merchants.find((m) => m.id === st.merchantId)?.categoryId === selectedCategoryId;
        const statusMatch = st.status === "ACTIVE";
        return withinRadius && offerMatch && categoryMatch && statusMatch;
      })
      .sort((a, b) => {
        // Boosted first, then score or distance
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [
    stores,
    offers,
    merchants,
    currentLat,
    currentLng,
    radiusMeters,
    hasOfferOnly,
    selectedCategoryId,
    featuredStoreIds,
    weights,
  ]);

  // Execute Real API Query against backend
  const executeRealApiQuery = async () => {
    setIsExecutingQuery(true);
    const start = performance.now();
    try {
      const { latencyMs } = await discoveryApi.getNearbyStores({
        lat: currentLat,
        lng: currentLng,
        radius: radiusMeters,
        categoryId: selectedCategoryId !== "ALL" ? selectedCategoryId : undefined,
        hasOffer: hasOfferOnly,
      });
      setApiLatencyMs(latencyMs);
      toast.success(`Nearby discovery executed in ${latencyMs}ms`);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setApiLatencyMs(elapsed);
      toast.info(`Queried locally in ${elapsed}ms`);
    } finally {
      setIsExecutingQuery(false);
    }
  };

  // Run initial API latency check
  useEffect(() => {
    executeRealApiQuery();
  }, [currentLat, currentLng, radiusMeters, hasOfferOnly, selectedCategoryId]);

  // Handle City Selection
  const handleCityChange = (cityName: string) => {
    setSelectedCityName(cityName);
    const city = operatingCities.find((c) => c.name === cityName);
    if (city && city.latitude && city.longitude) {
      setCurrentLat(city.latitude);
      setCurrentLng(city.longitude);
      toast.info(`Switched center to ${city.name} (${city.state})`);
    }
  };

  // Add City Handler with Full Backend Persistence & Audit
  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !newCityState.trim()) {
      toast.error("City name and state are required");
      return;
    }

    const slug = newCitySlug.trim().toLowerCase() || newCityName.trim().toLowerCase().replace(/\s+/g, "-");
    const lat = parseFloat(newCityLat) || 21.1458;
    const lng = parseFloat(newCityLng) || 79.0882;
    const radius = parseInt(newCityRadius) || 25000;

    const payload: OperatingCity = {
      id: `city-${Date.now()}`,
      name: newCityName.trim(),
      slug,
      state: newCityState.trim(),
      country: "India",
      status: "ACTIVE",
      latitude: lat,
      longitude: lng,
      serviceRadiusMeters: radius,
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await discoveryApi.createCity({
        name: payload.name,
        slug: payload.slug,
        state: payload.state,
        country: payload.country,
        latitude: lat,
        longitude: lng,
        serviceRadiusMeters: radius,
      });
      if (created?.id) {
        payload.id = created.id;
      }
    } catch (err) {
      console.warn("Backend city save fallback to local:", err);
    }

    const updated = [payload, ...operatingCities];
    setOperatingCities(updated);
    store.setOperatingCities(updated);

    // Record Audit Event
    store.addAudit({
      user: store.currentUser?.email || "Super Admin",
      action: "CREATE_OPERATING_CITY",
      target: payload.name,
      details: `Added new operating territory ${payload.name} (${payload.state}) with radius ${radius}m`,
      status: "SUCCESS",
    });

    toast.success(`Operating city ${payload.name} created successfully!`);
    setIsAddCityOpen(false);
    setNewCityName("");
    setNewCitySlug("");
    setNewCityState("");
  };

  // Toggle City Status with Audit Log
  const handleToggleCityStatus = async (city: OperatingCity) => {
    const newStatus: "ACTIVE" | "INACTIVE" = city.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await discoveryApi.updateCityStatus(city.id, newStatus);
    } catch (err) {
      console.warn("Backend status update fallback to local:", err);
    }

    const updated: OperatingCity[] = operatingCities.map((c) =>
      c.id === city.id ? { ...c, status: newStatus } : c
    );
    setOperatingCities(updated);
    store.setOperatingCities(updated);

    // Record Audit
    store.addAudit({
      user: store.currentUser?.email || "Super Admin",
      action: "TOGGLE_CITY_STATUS",
      target: city.name,
      details: `Changed territory status of ${city.name} to ${newStatus}`,
      status: "SUCCESS",
    });

    toast.success(`${city.name} marked as ${newStatus}`);
  };

  // Direct "Test in Simulator" from Cities table
  const handleTestCityInSimulator = (city: OperatingCity) => {
    if (city.latitude && city.longitude) {
      setCurrentLat(city.latitude);
      setCurrentLng(city.longitude);
      setSelectedCityName(city.name);
      if (city.serviceRadiusMeters) {
        setRadiusMeters(Math.min(city.serviceRadiusMeters, 15000));
      }
      setActiveSubTab("simulator");
      toast.info(`Loaded ${city.name} coordinates into interactive map`);
    } else {
      toast.warning(`City ${city.name} does not have coordinates defined`);
    }
  };

  // Toggle Boost on Store with Persistence
  const handleToggleStoreBoost = (storeId: string) => {
    setFeaturedStoreIds((prev) => {
      const next = { ...prev };
      let actionLabel = "";
      if (next[storeId]) {
        delete next[storeId];
        actionLabel = "Removed boost";
        toast.info("Store removed from discovery home boost");
      } else {
        const nextRank = Object.keys(next).length + 1;
        next[storeId] = nextRank;
        actionLabel = `Boosted to Rank #${nextRank}`;
        toast.success(`Store boosted to priority #${nextRank} on discovery feed`);
      }

      // Persist to Store
      store.setDiscoveryCuration({
        featuredStoreIds: next,
        heroOfferId,
        rankingWeights: weights,
        updatedAt: new Date().toISOString(),
      });

      // Audit Log
      const targetStore = stores.find((s) => s.id === storeId);
      store.addAudit({
        user: store.currentUser?.email || "Super Admin",
        action: "UPDATE_STORE_BOOST",
        target: targetStore?.storeName || storeId,
        details: `${actionLabel} for store ${targetStore?.storeName || storeId}`,
        status: "SUCCESS",
      });

      return next;
    });
  };

  // Save Discovery Algorithm Weights with Persistence & Audit
  const handleSaveWeights = () => {
    const total = weights.distance + weights.discountValue + weights.rating + weights.popularity;
    if (total !== 100) {
      toast.error(`Weights must total 100%. Currently at ${total}%`);
      return;
    }

    // Persist to Store / LocalStorage
    store.setDiscoveryCuration({
      featuredStoreIds,
      heroOfferId,
      rankingWeights: weights,
      updatedAt: new Date().toISOString(),
    });

    // Record Audit Log
    store.addAudit({
      user: store.currentUser?.email || "Super Admin",
      action: "DEPLOY_DISCOVERY_WEIGHTS",
      target: "Discovery Ranking Algorithm",
      details: `Distance: ${weights.distance}%, Discount: ${weights.discountValue}%, Rating: ${weights.rating}%, Popularity: ${weights.popularity}%`,
      status: "SUCCESS",
    });

    toast.success("Discovery ranking weights deployed and saved!");

    // Broadcast update across tabs
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("pinak_discovery_sync");
      channel.postMessage({ type: "CURATION_UPDATED" });
      channel.close();
    }
  };

  // Export Curation Config as JSON
  const handleExportConfig = () => {
    const configData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      featuredStoreIds,
      heroOfferId,
      rankingWeights: weights,
    };
    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pinak-discovery-curation-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Discovery curation rules exported to JSON!");
  };

  // Import Curation Config from JSON
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.rankingWeights && typeof parsed.rankingWeights.distance === "number") {
          setWeights(parsed.rankingWeights);
        }
        if (parsed.featuredStoreIds) {
          setFeaturedStoreIds(parsed.featuredStoreIds);
        }
        if (parsed.heroOfferId) {
          setHeroOfferId(parsed.heroOfferId);
        }

        store.setDiscoveryCuration({
          featuredStoreIds: parsed.featuredStoreIds || {},
          heroOfferId: parsed.heroOfferId || "",
          rankingWeights: parsed.rankingWeights || weights,
          updatedAt: new Date().toISOString(),
        });

        toast.success("Discovery curation rules imported successfully!");
      } catch (err) {
        toast.error("Invalid configuration JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Cross-tab Synchronization Listener
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("pinak_discovery_sync");
    channel.onmessage = (event) => {
      if (event.data?.type === "CURATION_UPDATED") {
        const latest = store.discoveryCuration;
        if (latest) {
          if (latest.featuredStoreIds) setFeaturedStoreIds(latest.featuredStoreIds);
          if (latest.heroOfferId) setHeroOfferId(latest.heroOfferId);
          if (latest.rankingWeights) setWeights(latest.rankingWeights);
        }
      }
    };
    return () => {
      channel.close();
    };
  }, []);

  // Live Multi-Entity Global Search Execution
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRemoteSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const start = performance.now();
      try {
        const { result, latencyMs } = await discoveryApi.globalSearch({
          q: searchQuery,
          type: searchType,
          lat: currentLat,
          lng: currentLng,
          radius: radiusMeters,
        });
        setSearchLatency(latencyMs);
        setRemoteSearchResults(result);
      } catch {
        setSearchLatency(Math.round(performance.now() - start));
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, currentLat, currentLng, radiusMeters]);

  // Search Results with Fallback to local
  const finalSearchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return { stores: [], categories: [], offers: [] };
    }

    if (remoteSearchResults && remoteSearchResults.totalResults > 0) {
      return {
        stores: remoteSearchResults.stores || [],
        categories: remoteSearchResults.categories || [],
        offers: remoteSearchResults.offers || [],
      };
    }

    // Client-side fallback search
    const q = searchQuery.toLowerCase().trim();
    const matchedStores = (searchType === "ALL" || searchType === "STORE")
      ? stores.filter(
          (s) =>
            s.storeName.toLowerCase().includes(q) ||
            s.branchName.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.merchantName.toLowerCase().includes(q)
        )
      : [];

    const matchedCategories = (searchType === "ALL" || searchType === "CATEGORY")
      ? categories.filter((c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
      : [];

    const matchedOffers = (searchType === "ALL" || searchType === "OFFER")
      ? offers.filter(
          (o) =>
            o.title.toLowerCase().includes(q) ||
            o.merchantName.toLowerCase().includes(q) ||
            o.type.toLowerCase().includes(q)
        )
      : [];

    return { stores: matchedStores, categories: matchedCategories, offers: matchedOffers };
  }, [searchQuery, searchType, remoteSearchResults, stores, categories, offers]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Main Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/20 shrink-0 mt-0.5 sm:mt-0">
            <Compass size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white leading-tight">
                Discovery & Location Control Center
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 flex items-center gap-1 shrink-0">
                <Sparkles size={12} /> Live Location Intelligence
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage mobile discovery feeds, spatial search radius, operating territories, and store ranking boosts.
            </p>
          </div>
        </div>

        {/* Quick Header Status & Sync */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-600 dark:text-slate-300">Spatial Engine:</span>
            <span className="font-bold text-slate-900 dark:text-white">Active</span>
          </div>
          <button
            onClick={executeRealApiQuery}
            disabled={isExecutingQuery}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Refresh Spatial Data"
          >
            <RefreshCw size={13} className={isExecutingQuery ? "animate-spin text-pink-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Global Sub-Tab Navigation Bar (Dedicated Full-Width Row) */}
      <div className="p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5 overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveSubTab("simulator")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "simulator"
              ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Compass size={15} />
          <span>Location Simulator</span>
        </button>

        <button
          onClick={() => setActiveSubTab("cities")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "cities"
              ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Globe size={15} />
          <span>Operating Cities</span>
          <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
            activeSubTab === "cities"
              ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}>
            {operatingCities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("curation")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "curation"
              ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Sparkles size={15} />
          <span>Feed Curation & Boost</span>
        </button>

        <button
          onClick={() => setActiveSubTab("diagnostics")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeSubTab === "diagnostics"
              ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
          }`}
        >
          <Search size={15} />
          <span>Search Diagnostics</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: POSTGIS SPATIAL SIMULATOR & LEAFLET MAP         */}
      {/* ========================================================= */}
      {activeSubTab === "simulator" && (
        <div className="space-y-6">
          {/* Simulator Controls Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Preset City Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Preset City Center</span>
                  <button
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                  >
                    <Navigation size={11} className={isLocating ? "animate-spin" : ""} />
                    {isLocating ? "Locating..." : "Use My GPS"}
                  </button>
                </label>
                <select
                  value={selectedCityName}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                >
                  {operatingCities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.state})
                    </option>
                  ))}
                  {selectedCityName === "Custom Device GPS" && (
                    <option value="Custom Device GPS">Current Device GPS</option>
                  )}
                </select>
              </div>

              {/* Exact Lat / Lng inputs */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Search Coordinates (Lat / Lng)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={currentLat}
                    onChange={(e) => setCurrentLat(parseFloat(e.target.value) || 0)}
                    placeholder="Lat"
                    className="w-full px-2.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    step="any"
                    value={currentLng}
                    onChange={(e) => setCurrentLng(parseFloat(e.target.value) || 0)}
                    placeholder="Lng"
                    className="w-full px-2.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Radius Slider with Debounced Visuals */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Search Radius</span>
                  <span className="text-pink-600 dark:text-pink-400 font-extrabold font-mono">
                    {(radiusMeters / 1000).toFixed(1)} km ({radiusMeters.toLocaleString()}m)
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(parseInt(e.target.value))}
                  className="w-full accent-pink-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>500m</span>
                  <span>5km</span>
                  <span>10km</span>
                  <span>25km</span>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Category Filter
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Badges & Server Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasOfferOnly}
                    onChange={(e) => setHasOfferOnly(e.target.checked)}
                    className="rounded-md accent-pink-600 w-4 h-4"
                  />
                  <span>Active Offers Only</span>
                </label>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Territory Status:</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Active Service Zone</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">
                  Matching Active Stores:{" "}
                  <strong className="text-pink-600 dark:text-pink-400 text-sm">
                    {calculatedStores.length}
                  </strong>
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold flex items-center gap-1">
                  <Zap size={11} />
                  {apiLatencyMs !== null ? `${apiLatencyMs}ms roundtrip` : "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* Main Grid: Stores Feed & Interactive Leaflet Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Ranked Store Feed */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                    Ranked Nearby Feed
                  </h3>
                  <p className="text-[11px] text-slate-400">Order delivered to mobile app</p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {calculatedStores.length} Stores
                </Badge>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
                {calculatedStores.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <Compass size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No stores found</p>
                    <p className="text-[11px]">No active outlets within {(radiusMeters / 1000).toFixed(1)} km. Expand the radius slider or pick another city center.</p>
                  </div>
                ) : (
                  calculatedStores.map((st, idx) => (
                    <div
                      key={st.id}
                      onClick={() => setInspectStore(st)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        st.isBoosted
                          ? "border-pink-300/80 dark:border-pink-900/60 bg-pink-50/30 dark:bg-pink-950/20 shadow-xs"
                          : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                st.isBoosted
                                  ? "bg-pink-500 text-white"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {st.storeName || st.branchName}
                            </h4>
                            {st.isBoosted && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-pink-500 text-white flex items-center gap-0.5">
                                <Sparkles size={9} /> Boosted
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {st.merchantName} · {st.city}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 block">
                            {st.distanceKm} km
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                            ~{Math.round(st.distanceMeters / 80)}m walk
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {st.address}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={12} fill="currentColor" />
                          <span>{st.merchantRating.toFixed(1)}</span>
                        </div>

                        {st.activeOffers.length > 0 ? (
                          <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                            <TicketPercent size={12} />
                            <span className="truncate max-w-[150px]">{st.activeOffers[0].title}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No active deals</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Leaflet Interactive Map */}
            <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass size={18} className="text-purple-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                      Interactive Geographic Coverage Map
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Center: {currentLat.toFixed(4)}, {currentLng.toFixed(4)} · Radius: {(radiusMeters / 1000).toFixed(1)} km · Click anywhere on the map to relocate
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={executeRealApiQuery}
                    disabled={isExecutingQuery}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Refresh Map & Spatial Query"
                  >
                    <RefreshCw size={14} className={isExecutingQuery ? "animate-spin text-pink-600" : ""} />
                  </button>
                </div>
              </div>

              {/* High-Performance Leaflet Map View */}
              <DiscoveryLeafletMap
                center={{ lat: currentLat, lng: currentLng }}
                radiusMeters={radiusMeters}
                stores={calculatedStores}
                height="420px"
                onCenterChange={(lat, lng) => {
                  setCurrentLat(lat);
                  setCurrentLng(lng);
                  setSelectedCityName("Custom Pin Location");
                  toast.info(`Updated search location to: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }}
                onSelectStore={(st) => setInspectStore(st)}
              />

              {/* Live Area Coverage Analytics */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Active Coordinates</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Coverage Area</span>
                    <span className="font-bold text-pink-600 dark:text-pink-400">
                      {(Math.PI * Math.pow(radiusMeters / 1000, 2)).toFixed(1)} km²
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Nearest Store</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {calculatedStores.length > 0 ? `${calculatedStores[0].distanceKm} km (${calculatedStores[0].branchName})` : "None in range"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Search Response:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Optimal (~{apiLatencyMs || 12}ms)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: OPERATING CITIES & GEOFENCING MASTER DATA       */}
      {/* ========================================================= */}
      {activeSubTab === "cities" && (
        <div className="space-y-6">
          {/* Action & Stats Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Operating Cities & Service Territories
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cities where customer discovery and merchant onboarding are actively enabled.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">
                Active Territories:{" "}
                <strong className="text-pink-600 dark:text-pink-400">
                  {operatingCities.filter((c) => c.status === "ACTIVE").length} / {operatingCities.length}
                </strong>
              </span>

              <button
                onClick={() => setIsAddCityOpen(true)}
                className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md shadow-pink-500/20"
              >
                <Plus size={15} />
                <span>Add Operating City</span>
              </button>
            </div>
          </div>

          {/* Cities Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operatingCities.map((city) => {
              const cityStores = stores.filter(
                (s) => s.city.toLowerCase() === city.name.toLowerCase()
              );
              const isActive = city.status === "ACTIVE";

              return (
                <div
                  key={city.id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 bg-white dark:bg-[#121626] ${
                    isActive
                      ? "border-slate-200/80 dark:border-slate-800 hover:border-pink-300"
                      : "border-slate-200/60 dark:border-slate-800/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                        {city.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {city.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {city.state}, {city.country || "India"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleCityStatus(city)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Coordinates</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {city.latitude?.toFixed(2) || "21.14"}, {city.longitude?.toFixed(2) || "79.08"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Live Outlets</span>
                      <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                        {cityStores.length} stores
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-400">
                      slug: /{city.slug}
                    </span>

                    <button
                      onClick={() => handleTestCityInSimulator(city)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                    >
                      <Navigation size={12} />
                      <span>View on Map</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add City Modal Dialog */}
          {isAddCityOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-pink-600" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                      Add Operating City
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddCityOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateCity} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      City Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCityName}
                      onChange={(e) => {
                        setNewCityName(e.target.value);
                        if (!newCitySlug) {
                          setNewCitySlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                        }
                      }}
                      placeholder="e.g., Ahmedabad"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCitySlug}
                        onChange={(e) => setNewCitySlug(e.target.value.toLowerCase())}
                        placeholder="ahmedabad"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCityState}
                        onChange={(e) => setNewCityState(e.target.value)}
                        placeholder="Gujarat"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newCityLat}
                        onChange={(e) => setNewCityLat(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newCityLng}
                        onChange={(e) => setNewCityLng(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Service Radius (meters)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={newCityRadius}
                      onChange={(e) => setNewCityRadius(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddCityOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
                    >
                      Save Operating City
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: FEED CURATION & DISCOVERY BOOSTING              */}
      {/* ========================================================= */}
      {activeSubTab === "curation" && (
        <div className="space-y-6">
          {/* Curation Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Discovery Feed Curation & Ranking Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure which merchants appear first to consumers and fine-tune search ranking algorithm weights.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <input
                type="file"
                id="import-curation-input"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
              <label
                htmlFor="import-curation-input"
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload size={14} />
                <span>Import JSON</span>
              </label>

              <button
                onClick={handleExportConfig}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block">Boosted Stores on Home</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold font-['Manrope'] text-pink-600 dark:text-pink-400">
                  {Object.keys(featuredStoreIds).length}
                </span>
                <span className="text-xs text-slate-500">priority pins active</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block">Hero Deal of the Day</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {offers.find((o) => o.id === heroOfferId)?.title || "None selected"}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 font-semibold block">Ranking Weights Health</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold font-['Manrope'] text-emerald-600 dark:text-emerald-400">
                  {weights.distance + weights.discountValue + weights.rating + weights.popularity}%
                </span>
                <span className="text-xs text-slate-500">allocation balanced</span>
              </div>
            </div>
          </div>

          {/* Two-Column: Promoted Stores & Discovery Formula */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promoted / Boosted Stores List */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                    Home Feed Promoted Outlets
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Stores boosted to the top of consumer home recommendations (Persisted to storage)
                  </p>
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {Object.keys(featuredStoreIds).length} Boosted
                </Badge>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {stores.map((st) => {
                  const isBoosted = !!featuredStoreIds[st.id];
                  const priority = featuredStoreIds[st.id];

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isBoosted
                          ? "border-pink-300 dark:border-pink-900/60 bg-pink-50/40 dark:bg-pink-950/20"
                          : "border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {st.storeName || st.branchName}
                          </h4>
                          {isBoosted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white flex items-center gap-1">
                              <Sparkles size={10} /> Rank #{priority}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {st.merchantName} · {st.city}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleStoreBoost(st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          isBoosted
                            ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 hover:bg-pink-200"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300"
                        }`}
                      >
                        {isBoosted ? "Unpin Boost" : "Boost to Feed"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discovery Ranking Formula Sliders */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                  Discovery Score Algorithm Weights
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tune how mobile search balances distance vs discounts vs customer ratings.
                </p>
              </div>

              <div className="space-y-4">
                {/* Distance Weight */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Distance Proximity Weight</span>
                    <span className="text-pink-600 dark:text-pink-400 font-mono font-extrabold">{weights.distance}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={weights.distance}
                    onChange={(e) => setWeights({ ...weights, distance: parseInt(e.target.value) })}
                    className="w-full accent-pink-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Closer stores receive higher ranking boost</p>
                </div>

                {/* Offer Discount Weight */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Offer Value / Discount Weight</span>
                    <span className="text-purple-600 dark:text-purple-400 font-mono font-extrabold">{weights.discountValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={weights.discountValue}
                    onChange={(e) => setWeights({ ...weights, discountValue: parseInt(e.target.value) })}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Higher discount percentage increases visibility</p>
                </div>

                {/* Merchant Rating Weight */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Merchant Rating & Reviews</span>
                    <span className="text-amber-500 font-mono font-extrabold">{weights.rating}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="5"
                    value={weights.rating}
                    onChange={(e) => setWeights({ ...weights, rating: parseInt(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Stores with 4.5+ stars rank higher</p>
                </div>

                {/* Popularity Weight */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Redemption Popularity</span>
                    <span className="text-emerald-500 font-mono font-extrabold">{weights.popularity}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={weights.popularity}
                    onChange={(e) => setWeights({ ...weights, popularity: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Stores with high daily billings rank higher</p>
                </div>
              </div>

              {/* Hero Deal Selector */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Featured Deal of the Day (Home Carousel)
                </label>
                <select
                  value={heroOfferId}
                  onChange={(e) => {
                    setHeroOfferId(e.target.value);
                    store.setDiscoveryCuration({
                      featuredStoreIds,
                      heroOfferId: e.target.value,
                      rankingWeights: weights,
                      updatedAt: new Date().toISOString(),
                    });
                    toast.success("Hero Deal of the Day saved!");
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {offers.filter((o) => o.status === "ACTIVE").map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} — {o.merchantName} ({o.value}% Off)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveWeights}
                className="w-full btn-gradient py-2.5 rounded-xl text-xs font-bold text-white shadow-md shadow-pink-500/20"
              >
                Save & Deploy Ranking Weights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: GLOBAL SEARCH & DIAGNOSTICS SANDBOX             */}
      {/* ========================================================= */}
      {activeSubTab === "diagnostics" && (
        <div className="space-y-6">
          {/* Search Testing Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-['Manrope']">
                  Live Search & Discovery Sandbox
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search across Stores, Categories, and Deals in real-time.
                </p>
              </div>

              {searchLatency > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 self-start sm:self-auto">
                  {searchLatency}ms search response
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores, pizza, coffee, salons, 50% discount..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                {(["ALL", "STORE", "OFFER", "CATEGORY"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      searchType === type
                        ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stores Matches */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Building2 size={14} className="text-purple-500" />
                  <span>Matching Stores</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  {finalSearchResults.stores.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {finalSearchResults.stores.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No matching stores</div>
                ) : (
                  finalSearchResults.stores.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-1"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{s.storeName || s.name}</h4>
                      <p className="text-[11px] text-slate-400">{s.merchantName || "Verified Partner"} · {s.city || s.address?.city || "India"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Offers Matches */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <TicketPercent size={14} className="text-pink-500" />
                  <span>Matching Deals</span>
                </div>
                <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
                  {finalSearchResults.offers.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {finalSearchResults.offers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No matching offers</div>
                ) : (
                  finalSearchResults.offers.map((o: any) => (
                    <div
                      key={o.id}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-1"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{o.title}</h4>
                      <p className="text-[11px] text-pink-600 dark:text-pink-400 font-bold">{o.value ? `${o.value}% Off` : "Discount Deal"} · {o.merchantName || "Merchant"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Categories Matches */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <Filter size={14} className="text-cyan-500" />
                  <span>Matching Categories</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  {finalSearchResults.categories.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {finalSearchResults.categories.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No matching categories</div>
                ) : (
                  finalSearchResults.categories.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs space-y-1"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">{c.name}</h4>
                      <p className="text-[11px] text-slate-400">{c.description || "Browse collection"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Store Details Drawer Modal */}
      {inspectStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                  Store Discovery Details
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {inspectStore.storeName || inspectStore.branchName}
                </h3>
                <p className="text-xs text-slate-400">
                  {inspectStore.merchantName} · {inspectStore.city}, {inspectStore.state}
                </p>
              </div>

              <button
                onClick={() => setInspectStore(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Address</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{inspectStore.address}</p>
                <p className="text-[11px] font-mono text-slate-400">Pincode: {inspectStore.pincode}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Coordinates</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {inspectStore.latitude}, {inspectStore.longitude}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-semibold">Operating Hours</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {inspectStore.operatingHours || "10:00 AM - 10:00 PM"}
                  </span>
                </div>
              </div>

              {/* Active Offers */}
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Active Offers Available for Customers
                </span>
                {offers.filter(
                  (o) => (o.storeId === inspectStore.id || o.merchantId === inspectStore.merchantId) && o.status === "ACTIVE"
                ).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No live offers currently linked to this outlet.</p>
                ) : (
                  <div className="space-y-2">
                    {offers
                      .filter(
                        (o) =>
                          (o.storeId === inspectStore.id || o.merchantId === inspectStore.merchantId) &&
                          o.status === "ACTIVE"
                      )
                      .map((o) => (
                        <div
                          key={o.id}
                          className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{o.title}</span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Min Bill: ₹{o.minBillAmount} · {o.type}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {o.value}% Off
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleToggleStoreBoost(inspectStore.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 hover:bg-pink-100 flex items-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>
                  {featuredStoreIds[inspectStore.id] ? "Remove Boost" : "Boost to Home"}
                </span>
              </button>

              <button
                onClick={() => setInspectStore(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
