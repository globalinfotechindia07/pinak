import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  MapPin,
  Sparkles,
  CheckCircle2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  TicketPercent,
  Search,
  QrCode,
  Mic,
  Clock,
  Compass,
  CreditCard,
  User,
  UtensilsCrossed,
  Star,
  Users,
  Store,
  Tag,
  Plus,
  Navigation,
  MapPinOff,
  RefreshCw,
  Crosshair,
  Sliders,
  Globe,
  X,
  Percent
} from "lucide-react";
import { Link } from "wouter";
import apiClient from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ServiceDetailPreviewView } from "@/components/ServiceDetailPreviewView";
import { CustomerOrdersView } from "@/components/CustomerOrdersView";
import { TableBookingView } from "@/components/TableBookingView";
import tableBookingApi, { TableBookingDetails } from "@/api/tableBookingApi";

interface NearbyOffer {
  id?: string;
  offerId?: string;
  title: string;
  subtitle?: string;
  description?: string;
  type?: string;
  offerType?: string;
  value?: number;
  discountValue?: number;
  maxDiscountAmount?: number;
  minTransactionAmount?: number;
  minimumOrderAmount?: number;
  imgUrl?: string;
  imageUrl?: string;
  validTo?: string;
  expiresAt?: string;
  ctaText?: string;
  bonusCoins?: number;
  badgeText?: string;
  offerScope?: string;
  buyQuantity?: number;
  getQuantity?: number;
  redemptionType?: string;
  storeId?: string;
  merchant?: {
    merchantId?: string;
    name?: string;
    logoUrl?: string;
    isVerified?: boolean;
  };
  merchantSummary?: {
    id?: string;
    name?: string;
    logoUrl?: string;
    isVerified?: boolean;
  };
  branch?: {
    branchId?: string;
    name?: string;
    distanceMeters?: number;
  };
  branchSummary?: {
    storeId?: string;
    storeName?: string;
    distanceMeters?: number;
  };
  reward?: {
    coins?: number;
    label?: string;
  };
  rewardSummary?: {
    coins?: number;
    text?: string;
  };
}

interface ProductDeal {
  id: string;
  title: string;
  unitOrWeight?: string;
  dealPrice: number;
  originalPrice?: number;
  discountPct?: number;
  discountBadge?: string;
  imageUrl: string;
  merchantName?: string;
  storeName?: string;
  storeId?: string;
}

interface FeaturedMerchant {
  merchantId: string;
  name: string;
  logoUrl?: string;
  coverImageUrl?: string;
  categoryName?: string;
  rating?: {
    average: number;
    count: number;
  };
  distanceMeters?: number;
  featuredLabel?: string;
  bestOffer?: {
    offerId?: string;
    label?: string;
  };
  isVerified?: boolean;
}

function getStoreInitialsAndColor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("bigbasket")) return { initials: "bb", bg: "bg-red-100 text-red-600" };
  if (lower.includes("reliance")) return { initials: "RF", bg: "bg-blue-100 text-blue-700" };
  if (lower.includes("sharma")) return { initials: "SK", bg: "bg-amber-100 text-amber-800" };
  if (lower.includes("more")) return { initials: "more", bg: "bg-orange-100 text-orange-700" };
  if (lower.includes("haldiram")) return { initials: "H", bg: "bg-rose-100 text-rose-700" };
  if (lower.includes("canteen") || lower.includes("bombay")) return { initials: "TBC", bg: "bg-emerald-100 text-emerald-800" };
  
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return { initials: (words[0][0] + words[1][0]).toUpperCase(), bg: "bg-purple-100 text-purple-700" };
  }
  return { initials: name.slice(0, 2).toUpperCase(), bg: "bg-purple-100 text-purple-700" };
}

function getStoreBadgeTextAndBg(offerLabel?: string) {
  if (!offerLabel) return { text: "Featured Partner", bg: "bg-purple-700" };
  const lower = offerLabel.toLowerCase();
  if (lower.includes("10%")) return { text: "10% OFF", bg: "bg-emerald-700" };
  if (lower.includes("flat") || lower.includes("100")) return { text: "Flat ₹100 Off", bg: "bg-rose-600" };
  if (lower.includes("free")) return { text: "Free Delivery", bg: "bg-emerald-600" };
  if (lower.includes("20%")) return { text: "Up to 20% OFF", bg: "bg-purple-700" };
  if (lower.includes("30%")) return { text: "30% OFF", bg: "bg-amber-600" };
  if (lower.includes("40%")) return { text: "40% OFF", bg: "bg-rose-600" };
  return { text: "Special Deal", bg: "bg-purple-700" };
}

interface PopularCollection {
  id: string;
  title: string;
  subtitle?: string;
  coverImageUrl?: string;
  badgeText?: string;
  displayOrder?: number;
}

interface FlashDealItem {
  offerId: string;
  title: string;
  imageUrl?: string;
  badgeText?: string;
  offerType?: string;
  price?: {
    currency: string;
    sellingPrice: number;
    mrp: number;
  };
  startsAt?: string;
  endsAt?: string;
  remainingQuantity?: number;
  branchId?: string;
  eligibilityStatus?: string;
}

interface RecentlyViewedItem {
  id: string;
  title: string;
  unit: string;
  dealPrice: number;
  originalPrice: number;
  imageUrl: string;
}

interface RecommendationItem {
  id: string;
  title: string;
  badge: string;
  distanceCategory: string;
  discountBadge: string;
  imageUrl: string;
}

function getCollectionGradient(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("essential") || lower.includes("grocer")) {
    return { bg: "from-amber-50 to-orange-50 border-orange-100", text: "text-orange-600" };
  }
  if (lower.includes("electron")) {
    return { bg: "from-blue-50 to-indigo-50 border-indigo-100", text: "text-blue-600" };
  }
  if (lower.includes("home") || lower.includes("improv")) {
    return { bg: "from-purple-50 to-pink-50 border-purple-100", text: "text-purple-600" };
  }
  if (lower.includes("beauty") || lower.includes("personal")) {
    return { bg: "from-rose-50 to-pink-50 border-rose-100", text: "text-rose-600" };
  }
  return { bg: "from-sky-50 to-blue-50 border-sky-100", text: "text-sky-600" };
}

/**
 * Formats dynamic time-left expiry badge:
 * e.g., "45m left", "3h left", "Till Sun", "Till Mon", "5d left"
 */
function formatTimeLeftBadge(expiryStr?: string | null): { text: string; bg: string } {
  if (!expiryStr) {
    return { text: "Till Sun", bg: "bg-indigo-700/95" };
  }
  const expiry = new Date(expiryStr);
  if (isNaN(expiry.getTime())) {
    return { text: "Till Sun", bg: "bg-indigo-700/95" };
  }
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { text: "Expiring soon", bg: "bg-rose-600/95" };
  }

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return { text: `${Math.max(1, diffMins)}m left`, bg: "bg-rose-600/95" };
  }
  if (diffHours < 24) {
    return { text: `${diffHours}h left`, bg: "bg-amber-600/95" };
  }
  if (diffDays <= 7) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return { text: `Till ${days[expiry.getDay()]}`, bg: "bg-indigo-700/95" };
  }
  return { text: `${diffDays}d left`, bg: "bg-purple-700/95" };
}

/**
 * Deduplicates offers by store and picks ONLY the single best, latest offer for each store.
 * Aggregates redemption types (Pre-booking, Walk-in, or Both) across all branch offers.
 */
function deduplicateOffersByStore(rawOffers: NearbyOffer[]): NearbyOffer[] {
  const storeMap = new Map<string, NearbyOffer>();
  const storeOfferTypes = new Map<string, { hasPreBook: boolean; hasWalkIn: boolean }>();

  for (const o of rawOffers) {
    const storeKey = (
      o.branch?.branchId ||
      o.branchSummary?.storeId ||
      o.branch?.name ||
      o.branchSummary?.storeName ||
      o.merchant?.merchantId ||
      o.merchantSummary?.id ||
      o.merchant?.name ||
      o.merchantSummary?.name ||
      o.offerId ||
      o.id ||
      ""
    ).trim().toLowerCase();

    const rType = (o.redemptionType || "").toUpperCase();
    const isPre = rType === "PRE_BOOK" || rType === "BOTH" || (o.ctaText && o.ctaText.toLowerCase().includes("book"));
    const isWalk = rType === "WALK_IN" || rType === "BOTH" || (o.ctaText && o.ctaText.toLowerCase().includes("pay"));

    const currentTypes = storeOfferTypes.get(storeKey) || { hasPreBook: false, hasWalkIn: false };
    if (isPre) currentTypes.hasPreBook = true;
    if (isWalk) currentTypes.hasWalkIn = true;
    storeOfferTypes.set(storeKey, currentTypes);

    const currentVal = Number(o.discountValue ?? o.value ?? 0);
    const currentExpiry = o.expiresAt
      ? new Date(o.expiresAt).getTime()
      : o.validTo
      ? new Date(o.validTo).getTime()
      : 0;

    if (!storeMap.has(storeKey)) {
      storeMap.set(storeKey, o);
    } else {
      const existing = storeMap.get(storeKey)!;
      const existingVal = Number(existing.discountValue ?? existing.value ?? 0);
      const existingExpiry = existing.expiresAt
        ? new Date(existing.expiresAt).getTime()
        : existing.validTo
        ? new Date(existing.validTo).getTime()
        : 0;

      // Higher discount value wins. If identical, the one expiring later or latest wins.
      if (currentVal > existingVal || (currentVal === existingVal && currentExpiry >= existingExpiry)) {
        storeMap.set(storeKey, o);
      }
    }
  }

  // Enrich winning offer with aggregated store redemption capabilities
  return Array.from(storeMap.entries()).map(([storeKey, offer]) => {
    const types = storeOfferTypes.get(storeKey);
    let resolvedRedemption = offer.redemptionType || "BOTH";
    if (types?.hasPreBook && types?.hasWalkIn) {
      resolvedRedemption = "BOTH";
    } else if (types?.hasWalkIn && !types?.hasPreBook) {
      resolvedRedemption = "WALK_IN";
    } else if (types?.hasPreBook && !types?.hasWalkIn) {
      resolvedRedemption = "PRE_BOOK";
    }
    return {
      ...offer,
      redemptionType: resolvedRedemption
    };
  });
}

export default function CustomerHomePreviewPage() {
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialStoreId = searchParams?.get("storeId");
  const [activeScreen, setActiveScreen] = useState<"home" | "detail" | "orders" | "booking_pass">(initialStoreId ? "detail" : "home");
  const [initialDetailView, setInitialDetailView] = useState<"detail" | "booking">("detail");
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || "");
  const [isPayingBill, setIsPayingBill] = useState<boolean>(false);
  const [activeBooking, setActiveBooking] = useState<TableBookingDetails | null>(null);
  const [activeBookingsList, setActiveBookingsList] = useState<TableBookingDetails[]>([]);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<TableBookingDetails | null>(null);
  const [dismissedBookingRefs, setDismissedBookingRefs] = useState<Set<string>>(new Set());
  const [activeBookingCarouselIndex, setActiveBookingCarouselIndex] = useState<number>(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const effectivePassBooking = selectedBookingForPass || activeBooking;
  const visibleBookings = activeBookingsList.filter(
    (b) => !dismissedBookingRefs.has(b.bookingRef || b.bookingId)
  );
  const [offers, setOffers] = useState<NearbyOffer[]>([]);
  const [productDeals, setProductDeals] = useState<ProductDeal[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedMerchant[]>([]);
  const [collections, setCollections] = useState<PopularCollection[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDealItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(10);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isApplyingCoords, setIsApplyingCoords] = useState(false);

  // Initialize coordinates from localStorage so manual user settings persist across reloads
  const [userLocation, setUserLocation] = useState<{
    name: string;
    city: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const qLat = params.get("lat");
        const qLng = params.get("lng");
        const qName = params.get("name");
        if (qLat && qLng && !isNaN(Number(qLat)) && !isNaN(Number(qLng))) {
          const latNum = Number(qLat);
          const lngNum = Number(qLng);
          return {
            name: qName ? decodeURIComponent(qName) : `Branch Location (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`,
            city: "Selected Outlet Location",
            latitude: latNum,
            longitude: lngNum,
            radiusKm: 15.0
          };
        }

        const saved = localStorage.getItem("pinak_preview_coords");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
            return {
              name: parsed.name || "The Bombay Canteen (Nagpur)",
              city: parsed.city || "Nagpur, Maharashtra",
              latitude: Number(parsed.latitude),
              longitude: Number(parsed.longitude),
              radiusKm: Number(parsed.radiusKm || 15.0)
            };
          }
        }
      } catch {
        // fallback
      }
    }
    return {
      name: "The Bombay Canteen (Nagpur)",
      city: "Nagpur, Maharashtra",
      latitude: 21.112875,
      longitude: 79.059910,
      radiusKm: 15.0
    };
  });

  // Numeric text inputs for live custom coordinate setting
  const [customLatInput, setCustomLatInput] = useState<string>(() => userLocation.latitude.toString());
  const [customLngInput, setCustomLngInput] = useState<string>(() => userLocation.longitude.toString());
  const [customRadiusInput, setCustomRadiusInput] = useState<string>(() => (userLocation.radiusKm || 15).toString());

  // Keep inputs synchronized when userLocation changes & persist to localStorage
  useEffect(() => {
    setCustomLatInput(userLocation.latitude.toString());
    setCustomLngInput(userLocation.longitude.toString());
    setCustomRadiusInput((userLocation.radiusKm || 15).toString());
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pinak_preview_coords", JSON.stringify(userLocation));
      } catch {
        // ignore
      }
    }
  }, [userLocation]);

  const PRESET_LOCATIONS = [
    {
      name: "The Bombay Canteen (Flagship Outlet)",
      city: "Nagpur, Maharashtra",
      latitude: 21.112875,
      longitude: 79.059910,
      radiusKm: 15.0
    },
    {
      name: "West High Court Rd, Dharampeth",
      city: "Nagpur, Maharashtra",
      latitude: 21.145800,
      longitude: 79.088200,
      radiusKm: 15.0
    },
    {
      name: "Residency Rd, Sadar",
      city: "Nagpur, Maharashtra",
      latitude: 21.161000,
      longitude: 79.083000,
      radiusKm: 15.0
    },
    {
      name: "FC Road, Shivajinagar",
      city: "Pune, Maharashtra",
      latitude: 18.520400,
      longitude: 73.856700,
      radiusKm: 15.0
    },
    {
      name: "Bandra Kurla Complex (BKC)",
      city: "Mumbai, Maharashtra",
      latitude: 19.065700,
      longitude: 72.868700,
      radiusKm: 15.0
    },
    {
      name: "100ft Rd, Indiranagar",
      city: "Bengaluru, Karnataka",
      latitude: 12.971600,
      longitude: 77.641200,
      radiusKm: 15.0
    },
    {
      name: "Connaught Place, Central",
      city: "New Delhi, Delhi",
      latitude: 28.631500,
      longitude: 77.216700,
      radiusKm: 15.0
    }
  ];

  const applyCustomCoordinates = async (
    latVal: string | number,
    lngVal: string | number,
    radiusVal?: string | number,
    overrideName?: string
  ) => {
    const lat = typeof latVal === "number" ? latVal : parseFloat(latVal);
    const lng = typeof lngVal === "number" ? lngVal : parseFloat(lngVal);
    const radius = radiusVal != null ? (typeof radiusVal === "number" ? radiusVal : parseFloat(radiusVal)) : (userLocation.radiusKm || 15);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error("Please enter a valid Latitude between -90 and 90");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error("Please enter a valid Longitude between -180 and 180");
      return;
    }
    const finalRadius = isNaN(radius) || radius <= 0 ? 15 : radius;

    setIsApplyingCoords(true);
    let resolvedName = overrideName || `Custom Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    let resolvedCity = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (!overrideName) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
          { headers: { "Accept-Language": "en" }, signal: controller.signal }
        );
        clearTimeout(timer);
        if (revRes.ok) {
          const rev = await revRes.json();
          const addr = rev.address || {};
          const locality = addr.suburb || addr.neighbourhood || addr.road || addr.residential || addr.village || addr.city || "Custom Location";
          const city = addr.city || addr.town || addr.county || addr.state_district || addr.state || "";
          resolvedName = locality;
          resolvedCity = city ? `${city} (${lat.toFixed(4)}, ${lng.toFixed(4)})` : `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }
      } catch {
        // Fallback to coordinates
      }
    }

    const updated = {
      name: resolvedName,
      city: resolvedCity,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      radiusKm: finalRadius
    };

    setUserLocation(updated);
    setIsApplyingCoords(false);
    setIsLocationMenuOpen(false);
    toast.success(`Active GPS set to ${lat.toFixed(4)}, ${lng.toFixed(4)} (${finalRadius}km radius)`);
  };

  const requestCurrentLocation = (explicit = false) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      if (explicit) toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        await applyCustomCoordinates(lat, lng, userLocation.radiusKm);
        setIsGpsLoading(false);
        if (explicit) {
          toast.success(`Device GPS acquired: ${lat}, ${lng}`);
        }
      },
      (err) => {
        setIsGpsLoading(false);
        if (explicit) {
          toast.error(`GPS Error: ${err.message}. Please allow location access in your browser.`);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const fetchNearbyOffers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/offers/nearby", {
        params: {
          type: "SERVICE",
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radiusKm: userLocation.radiusKm,
          limit: 10
        }
      });
      const data = res.data?.data;
      const list = Array.isArray(data?.offers) ? data.offers : Array.isArray(data) ? data : [];
      setOffers(list);
      if (list.length > 0 && !searchParams?.get("storeId")) {
        const firstStore = list[0].branch?.branchId || list[0].branchSummary?.storeId;
        if (firstStore) {
          setSelectedStoreId(firstStore);
        }
      }
    } catch (err: any) {
      console.warn("Could not fetch live service offers:", err?.message);
      setOffers([]);
    }

    try {
      const pRes = await apiClient.get("/offers/nearby", {
        params: {
          type: "PRODUCT",
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radiusKm: userLocation.radiusKm,
          limit: 10
        }
      });
      const pData = pRes.data?.data;
      const pList = Array.isArray(pData?.offers) ? pData.offers : Array.isArray(pData) ? pData : [];
      setProductDeals(
        pList.map((item: any) => {
          const orig = item.originalMrp ? Number(item.originalMrp) : undefined;
          let deal = item.flashSellingPrice ? Number(item.flashSellingPrice) : 0;
          const discVal = Number(item.discountValue ?? item.value ?? 0);
          const oType = (item.offerType || item.type || "").toUpperCase();

          if (!deal && orig && discVal > 0) {
            if (oType.includes("PERCENT") || discVal <= 100) {
              deal = Math.round(orig * (1 - discVal / 100));
            } else {
              deal = Math.max(0, orig - discVal);
            }
          } else if (!deal) {
            deal = discVal > 0 ? discVal : (orig || 99);
          }

          const pct = (orig && deal && orig > deal)
            ? Math.round(((orig - deal) / orig) * 100)
            : discVal > 0 ? discVal : 0;

          return {
            id: item.offerId || item.id,
            title: item.title,
            unitOrWeight: item.subtitle || "Standard Pack",
            dealPrice: deal,
            originalPrice: orig,
            discountPct: pct,
            discountBadge: item.badgeText || (pct > 0 ? `${pct}% OFF` : "DEAL"),
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
            merchantName: item.merchant?.name,
            storeName: item.branch?.name,
            storeId: item.branch?.branchId || item.branchSummary?.storeId
          };
        })
      );
    } catch (err: any) {
      console.warn("Could not fetch live product deals:", err?.message);
      setProductDeals([]);
    }

    try {
      const fRes = await apiClient.get("/merchants/featured", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          limit: 10
        }
      });
      const fData = fRes.data?.data;
      const fList = Array.isArray(fData?.merchants) ? fData.merchants : [];
      setFeaturedStores(fList);
      if (fList.length > 0 && !searchParams?.get("storeId")) {
        setSelectedStoreId((prev) => (prev ? prev : fList[0]?.merchantId));
      }
    } catch (err: any) {
      console.warn("Could not fetch live featured merchants:", err?.message);
      setFeaturedStores([]);
    }

    try {
      const cRes = await apiClient.get("/collections/popular", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radiusKm: userLocation.radiusKm || 15.0,
          limit: 10,
        },
      });
      const cData = cRes.data?.data;
      const cList = Array.isArray(cData?.collections) ? cData.collections : [];
      setCollections(cList);
    } catch (err: any) {
      console.warn("Could not fetch popular collections:", err?.message);
      setCollections([]);
    }

    try {
      const fRes = await apiClient.get("/offers/flash", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          limit: 10,
        },
      });
      const fData = fRes.data?.data;
      const fList = Array.isArray(fData?.deals) ? fData.deals : [];
      setFlashDeals(fList);
    } catch (err: any) {
      console.warn("Could not fetch live flash deals:", err?.message);
      setFlashDeals([]);
    }

    try {
      const rvRes = await apiClient.get("/users/me/recently-viewed", { params: { limit: 10 } });
      const rvData = rvRes.data?.data;
      const rvList = Array.isArray(rvData?.items) ? rvData.items : [];
      setRecentlyViewed(rvList);
    } catch {
      setRecentlyViewed([]);
    }

    try {
      const recRes = await apiClient.get("/recommendations", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          limit: 10
        }
      });
      const recData = recRes.data?.data;
      const recList = Array.isArray(recData?.recommendations) ? recData.recommendations : [];
      setRecommendations(recList);
    } catch {
      setRecommendations([]);
    }

    // Nearby store resolution if no store selected yet
    try {
      const sRes = await apiClient.get("/discovery/nearby", {
        params: {
          lat: userLocation.latitude,
          latitude: userLocation.latitude,
          lng: userLocation.longitude,
          longitude: userLocation.longitude,
          radius: (userLocation.radiusKm || 15.0) * 1000,
          size: 5
        }
      });
      const sData = sRes.data?.data;
      const sList = Array.isArray(sData) ? sData : [];
      if (sList.length > 0 && !searchParams?.get("storeId")) {
        setSelectedStoreId((prev) => (prev ? prev : sList[0].id));
      }
    } catch {
      // Ignore discovery nearby fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyOffers();
  }, [userLocation]);

  // Flash sale countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active bookings for the home screen floating card (matches Swiggy/Dineout)
  useEffect(() => {
    const fetchActiveBookings = async () => {
      try {
        const list = await tableBookingApi.listBookings();
        if (list && list.length > 0) {
          // Strictly filter out any COMPLETED, payment-completed, or CANCELLED bookings
          const validActive = list.filter((b) => {
            const status = (b.status || "").toUpperCase();
            const isCompleted = status === "COMPLETED" || b.isCompleted === true;
            const isCancelled = status === "CANCELLED" || b.isCancelled === true;
            const isDiningPaid =
              (b.diningPaymentStatus || "").toUpperCase() === "PAID" ||
              (b.billAmount != null && Number(b.billAmount) > 0 && isCompleted);
            return !isCancelled && !isCompleted && !isDiningPaid;
          });

          setActiveBookingsList(validActive);
          if (validActive.length > 0) {
            setActiveBooking((prev) => {
              if (
                prev &&
                validActive.some(
                  (item) => (item.bookingRef || item.bookingId) === (prev.bookingRef || prev.bookingId)
                )
              ) {
                return validActive.find(
                  (item) => (item.bookingRef || item.bookingId) === (prev.bookingRef || prev.bookingId)
                )!;
              }
              return validActive[0];
            });
          } else {
            setActiveBooking(null);
            setSelectedBookingForPass(null);
          }
        } else {
          setActiveBookingsList([]);
          setActiveBooking(null);
          setSelectedBookingForPass(null);
        }
      } catch (err) {
        console.warn("Could not fetch active bookings for home card:", err);
      }
    };

    fetchActiveBookings();
  }, [activeScreen]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success(favorites[id] ? "Removed from favorites" : "Saved to your favorites!");
  };

  const handleOpenStoreDetail = (storeId?: string) => {
    const validStoreId =
      storeId && storeId !== "e1000000-0000-0000-0000-000000000001"
        ? storeId
        : offers.find((o) => o.branch?.branchId || o.branchSummary?.storeId)?.branch?.branchId ||
          offers.find((o) => o.branchSummary?.storeId)?.branchSummary?.storeId ||
          "";
    if (validStoreId) {
      setSelectedStoreId(validStoreId);
      setActiveScreen("detail");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast.info("No specific branch outlet linked to this offer yet.");
    }
  };

  const handleClaimOffer = (title: string, storeName?: string, storeId?: string) => {
    handleOpenStoreDetail(storeId);
  };

  const displayedServiceOffers = deduplicateOffersByStore(offers);
  const displayedProductDeals = productDeals;
  const displayedFeaturedStores = featuredStores;
  const displayedCollections = collections;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center">
      {/* Top Admin Utility Bar */}
      <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/offers"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold"
          >
            <ArrowLeft size={14} />
            <span>Back to Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm font-['Manrope']">
              PINAK Customer Discovery App
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Reference Preview
            </span>
          </div>
        </div>

        {/* Screen 10 / Screen 11 / Screen 12 View Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveScreen("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer",
              activeScreen === "home"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Compass size={13} />
            <span>Screen 10: Discovery Feed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedStoreId) {
                const firstRealStore =
                  offers.find((o) => o.branch?.branchId || o.branchSummary?.storeId)?.branch?.branchId ||
                  offers.find((o) => o.branchSummary?.storeId)?.branchSummary?.storeId ||
                  featuredStores[0]?.merchantId ||
                  "";
                setSelectedStoreId(firstRealStore);
              }
              setInitialDetailView("detail");
              setActiveScreen("detail");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer",
              activeScreen === "detail"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <UtensilsCrossed size={13} />
            <span>Screen 11: Service Detail</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveScreen("orders");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer",
              activeScreen === "orders"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <TicketPercent size={13} />
            <span>Screen 12: Orders &amp; Bookings</span>
          </button>
          {activeBooking && (
            <button
              type="button"
              onClick={() => {
                setActiveScreen("booking_pass");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer",
                activeScreen === "booking_pass"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <CheckCircle2 size={13} />
              <span>Booking Pass</span>
            </button>
          )}
        </div>

        {/* Active GPS Coordinate Simulator Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-inner text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold px-1">
            <Crosshair size={13} className="text-purple-400" />
            <span className="text-[11px] font-bold text-slate-200">GPS Coords:</span>
          </div>

          {/* Latitude Input */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">Lat:</span>
            <input
              type="number"
              step="any"
              value={customLatInput}
              onChange={(e) => setCustomLatInput(e.target.value)}
              placeholder="21.112875"
              className="w-20 bg-transparent text-white font-mono text-[11px] focus:outline-none"
              title="Latitude (-90 to +90)"
            />
          </div>

          {/* Longitude Input */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">Lng:</span>
            <input
              type="number"
              step="any"
              value={customLngInput}
              onChange={(e) => setCustomLngInput(e.target.value)}
              placeholder="79.059910"
              className="w-20 bg-transparent text-white font-mono text-[11px] focus:outline-none"
              title="Longitude (-180 to +180)"
            />
          </div>

          {/* Radius Input */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">Radius:</span>
            <input
              type="number"
              min="1"
              max="2000"
              value={customRadiusInput}
              onChange={(e) => setCustomRadiusInput(e.target.value)}
              placeholder="15"
              className="w-10 bg-transparent text-white font-mono text-[11px] focus:outline-none text-right"
              title="Radius in kilometers"
            />
            <span className="text-[10px] text-slate-400 ml-0.5">km</span>
          </div>

          {/* Apply Coords Button */}
          <button
            type="button"
            onClick={() => applyCustomCoordinates(customLatInput, customLngInput, customRadiusInput)}
            disabled={isApplyingCoords || loading}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            title="Send these exact coordinates to backend APIs"
          >
            {isApplyingCoords ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
            <span>Apply Coords</span>
          </button>

          {/* Location Presets Button */}
          <button
            type="button"
            onClick={() => setIsLocationMenuOpen((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            title="Open Outlets & Cities presets"
          >
            <MapPin size={11} />
            <span>Presets</span>
          </button>

          {/* Refresh Live Deals */}
          <button
            onClick={() => {
              fetchNearbyOffers();
              toast.info("Refreshed nearby service offers from database");
            }}
            disabled={loading}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Refresh API Data"
          >
            <RotateCw size={13} className={loading ? "animate-spin text-purple-400" : ""} />
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="py-6 sm:py-10 px-2 sm:px-4 flex justify-center w-full">
        {/* iOS Mobile Phone Mockup Frame */}
        <div className="w-full max-w-[430px] bg-[#fbfbff] min-h-[900px] text-slate-800 relative pb-36 shadow-2xl rounded-[36px] overflow-hidden border-[6px] border-slate-800 ring-1 ring-slate-700">
          
          {/* iOS Status Bar */}
          <header className="sticky top-0 z-40 bg-[#fbfbff]/95 backdrop-blur-md pt-3 px-6 pb-1">
            <div className="flex justify-between items-center text-[13px] font-semibold tracking-tight text-slate-900">
              <span>9:41</span>
              <div className="flex items-center space-x-1.5">
                <svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12">
                  <rect height="4" rx="0.5" width="2.5" x="0" y="8"></rect>
                  <rect height="6" rx="0.5" width="2.5" x="4" y="6"></rect>
                  <rect height="8.5" rx="0.5" width="2.5" x="8" y="3.5"></rect>
                  <rect height="11" rx="0.5" width="2.5" x="12" y="1"></rect>
                </svg>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                  <path d="M8 12.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.24-2.83a6 6 0 0 1 8.48 0 .75.75 0 1 1-1.06 1.06 4.5 4.5 0 0 0-6.36 0 .75.75 0 1 1-1.06-1.06zm-2.83-2.83a10 10 0 0 1 14.14 0 .75.75 0 0 1-1.06 1.06 8.5 8.5 0 0 0-12.02 0 .75.75 0 0 1-1.06-1.06z"></path>
                </svg>
                <div className="w-5 h-2.5 border border-slate-900 rounded-xs p-0.5 flex items-center">
                  <div className="h-full bg-slate-900 rounded-2xs w-full"></div>
                </div>
              </div>
            </div>
          </header>

          {activeScreen === "detail" ? (
            <ServiceDetailPreviewView
              storeId={selectedStoreId}
              userLat={userLocation.latitude}
              userLng={userLocation.longitude}
              initialView={initialDetailView}
              onBack={() => {
                setInitialDetailView("detail");
                setActiveScreen("home");
              }}
            />
          ) : activeScreen === "booking_pass" && effectivePassBooking ? (
            <TableBookingView
              storeId={effectivePassBooking.storeId}
              storeName={effectivePassBooking.storeName}
              storeAddress={effectivePassBooking.storeAddress}
              contactPhone={effectivePassBooking.contactPhone}
              initialBookingStep="confirmed"
              initialBookingRef={effectivePassBooking.bookingRef}
              initialBookingDetails={effectivePassBooking}
              initialGuests={effectivePassBooking.guests}
              initialSlot={effectivePassBooking.slotTime}
              initialOfferTitle={effectivePassBooking.offerTitle}
              initialOfferDiscount={effectivePassBooking.discountPct ? Number(effectivePassBooking.discountPct) : undefined}
              initialCoverCharge={effectivePassBooking.totalCoverCharge ? Number(effectivePassBooking.totalCoverCharge) : 0}
              initialCustomerName={effectivePassBooking.customerName}
              initialCustomerPhone={effectivePassBooking.customerPhone}
              userLat={userLocation.latitude}
              userLng={userLocation.longitude}
              onBack={() => {
                setActiveScreen("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onViewStoreDetails={(storeId) => {
                if (storeId) setSelectedStoreId(storeId);
                setInitialDetailView("detail");
                setActiveScreen("detail");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : activeScreen === "orders" ? (
            <CustomerOrdersView
              onBackToDiscover={() => {
                setActiveScreen("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSelectStore={(storeId) => {
                setSelectedStoreId(storeId);
                setInitialDetailView("detail");
                setActiveScreen("detail");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onPayingBillChange={setIsPayingBill}
            />
          ) : (
            <>
              {/* Top Brand Header */}
              <header className="px-4 pt-2 pb-2 bg-[#fbfbff]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-purple-700 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
                  P
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">PINAK</h1>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight">Discover Best Deals</p>
                </div>
              </div>

              {/* Location Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLocationMenuOpen((v) => !v)}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 transition-colors max-w-[190px] rounded-lg text-left cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{userLocation.name}</p>
                    <p className="text-[9px] text-slate-500 truncate leading-none">
                      {userLocation.city} • {userLocation.radiusKm}km
                    </p>
                  </div>
                </button>

                {isLocationMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        GPS Discovery Coordinates
                      </span>
                      {isApplyingCoords && (
                        <span className="text-[9px] text-purple-600 font-semibold flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" /> Querying API...
                        </span>
                      )}
                    </div>

                    {/* Coordinate Input Form */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-2.5 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={customLatInput}
                            onChange={(e) => setCustomLatInput(e.target.value)}
                            placeholder="21.112875"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={customLngInput}
                            onChange={(e) => setCustomLngInput(e.target.value)}
                            placeholder="79.059910"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Search Radius (km)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="2000"
                            value={customRadiusInput}
                            onChange={(e) => setCustomRadiusInput(e.target.value)}
                            placeholder="15"
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          />
                        </div>
                        <div className="pt-4 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyCustomCoordinates(customLatInput, customLngInput, customRadiusInput)}
                            disabled={isApplyingCoords}
                            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span>Apply</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Presets Title */}
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
                      Quick Preset Outlets &amp; Cities
                    </span>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                      {PRESET_LOCATIONS.map((loc, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            applyCustomCoordinates(loc.latitude, loc.longitude, loc.radiusKm, loc.name);
                          }}
                          className={cn(
                            "w-full text-left p-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-start gap-2",
                            userLocation.name === loc.name ? "bg-purple-50 text-purple-900 font-bold border border-purple-200" : "hover:bg-slate-50 text-slate-700"
                          )}
                        >
                          <MapPin size={11} className={userLocation.name === loc.name ? "text-purple-600 shrink-0 mt-0.5" : "text-slate-400 shrink-0 mt-0.5"} />
                          <div className="min-w-0">
                            <p className="truncate leading-tight text-[11px]">{loc.name}</p>
                            <p className="text-[9px] text-slate-400 font-normal leading-tight font-mono">{loc.city} ({loc.latitude}, {loc.longitude})</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Auto-detect current device GPS */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => requestCurrentLocation(true)}
                        disabled={isGpsLoading}
                        className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Navigation size={12} className={isGpsLoading ? "animate-spin text-purple-600" : "text-purple-600"} />
                          <div>
                            <p className="text-[10px] font-bold leading-tight">Detect Real Device GPS</p>
                            <p className="text-[8px] text-slate-400">Query browser HTML5 geolocation</p>
                          </div>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Utilities */}
              <div className="flex items-center space-x-2 shrink-0">
                {Object.values(cart).reduce((a, b) => a + b, 0) > 0 && (
                  <div className="flex items-center bg-emerald-50 border border-emerald-300 px-2 py-0.5 space-x-1 rounded-md text-[10px] font-bold text-emerald-800 shadow-2xs animate-pulse">
                    <ShoppingBag size={11} className="text-emerald-600" />
                    <span>{Object.values(cart).reduce((a, b) => a + b, 0)} Cart</span>
                  </div>
                )}
                <div className="flex items-center bg-amber-50 border border-amber-200/80 px-2 py-0.5 space-x-1 shadow-2xs rounded-md">
                  <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-amber-900">
                    ₹
                  </div>
                  <div className="text-[10px] font-bold text-amber-900 leading-tight">
                    480<span className="block text-[8px] text-amber-700 font-medium leading-none">₹48</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  JD
                </div>
              </div>
            </div>
          </header>

          {/* Search Bar */}
          <section className="px-4 pt-1 pb-3">
            <div className="relative flex items-center bg-white shadow-xs border border-slate-200/80 px-3.5 py-2.5 rounded-xl">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                className="w-full bg-transparent border-0 text-xs px-2 text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Search products, shops, services & offers..."
                type="search"
              />
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-200 shrink-0">
                <button type="button" className="text-slate-500 hover:text-purple-600" title="Voice Search">
                  <Mic size={15} />
                </button>
                <button type="button" className="text-purple-600 hover:text-purple-800" title="Scan Store QR">
                  <QrCode size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* Hero Promo Banner */}
          <section className="px-4 mb-4">
            <div className="relative bg-gradient-to-br from-purple-800 via-purple-700 to-indigo-600 text-white p-4 overflow-hidden rounded-xl shadow-md">
              <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-400/20 rounded-full blur-2xl"></div>
              <div className="relative z-10 w-2/3 pr-2">
                <span className="inline-block bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide mb-1.5 border border-white/25 rounded-md">
                  Weekend Super Fest
                </span>
                <h2 className="text-base font-black leading-tight tracking-tight mb-1 text-white">
                  Flat 50% Cashback + 200 Extra Coins
                </h2>
                <p className="text-[10px] text-purple-100 font-medium leading-snug mb-3">
                  On dining, groceries, salons, electronics & more
                </p>
                <button
                  type="button"
                  onClick={() => toast.success("Browsing weekend carnival deals!")}
                  className="inline-flex items-center space-x-1.5 bg-white text-purple-950 font-extrabold text-[11px] px-3.5 py-1.5 shadow-sm hover:bg-slate-100 transition-transform active:scale-95 rounded-lg"
                >
                  <span>Explore Offers</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </section>

          {/* Explore Categories Rail */}
          <section className="mb-5">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">Explore Categories</h2>
                  <p className="text-[10px] text-slate-500">Shop products or services from verified stores</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 flex items-center space-x-0.5 cursor-pointer">
                View All
              </span>
            </div>

            <div className="flex space-x-3.5 overflow-x-auto no-scrollbar px-4 py-1">
              {[
                { name: "All", icon: "🔥", bg: "bg-purple-700 text-white" },
                { name: "Dining", icon: "🍔", bg: "bg-orange-100 text-orange-600" },
                { name: "Cafes", icon: "☕", bg: "bg-amber-100 text-amber-700" },
                { name: "Supermarket", icon: "🛒", bg: "bg-emerald-100 text-emerald-700" },
                { name: "Kirana", icon: "🏪", bg: "bg-rose-100 text-rose-600" },
                { name: "Fashion", icon: "👕", bg: "bg-indigo-100 text-indigo-600" },
                { name: "Electronics", icon: "💻", bg: "bg-sky-100 text-sky-600" },
                { name: "Salons", icon: "✂️", bg: "bg-pink-100 text-pink-600" },
              ].map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toast.info(`Filtered by category: ${cat.name}`)}
                  className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center text-lg shadow-xs transition-transform group-hover:scale-105`}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ========================================================= */}
          {/* TOP SERVICE OFFERS NEAR YOU (CONNECTED TO BACKEND API) */}
          {/* ========================================================= */}
          <section className="mb-5" data-purpose="service-offers-carousel">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-slate-900 leading-none">
                    Top Service Offers Near You
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Database Feed"></span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Best discounts on restaurants, salons, gyms & more
                </p>
              </div>
              <div className="flex items-center space-x-0.5 text-[11px] font-bold text-purple-700">
                <span>View All ({displayedServiceOffers.length})</span>
                <ChevronRight size={13} />
              </div>
            </div>

            {/* Horizontal Service Cards Rail */}
            {displayedServiceOffers.length === 0 ? (
              <div className="mx-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                  <MapPinOff size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    No Service Deals Within {userLocation.radiusKm} km
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Filtering strictly by coordinates ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}). No partner outlets have active service offers here.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      applyCustomCoordinates(21.112875, 79.059910, 15.0, "The Bombay Canteen (Nagpur)");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <MapPin size={11} />
                    <span>Set Coords: The Bombay Canteen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextR = (userLocation.radiusKm || 15) >= 1000 ? 1000 : (userLocation.radiusKm || 15) + 50;
                      applyCustomCoordinates(userLocation.latitude, userLocation.longitude, nextR);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Expand Radius (+50 km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLocationMenuOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sliders size={11} />
                    <span>Enter Custom Cords</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3.5 overflow-x-auto no-scrollbar px-4 py-1">
                {displayedServiceOffers.map((o) => {
                const offerKey = o.offerId || o.id || Math.random().toString();
                const branchName = o.branch?.name || o.branchSummary?.storeName;
                const merchantName = o.merchant?.name || o.merchantSummary?.name;
                const storeDisplayName = branchName || merchantName || o.title || "Partner Store";

                const distanceMeters = o.branch?.distanceMeters ?? o.branchSummary?.distanceMeters;
                const distanceText = distanceMeters != null
                  ? (distanceMeters < 1000
                    ? `${distanceMeters}m away`
                    : `${(distanceMeters / 1000).toFixed(1)} km away`)
                  : "Nearby";

                const discountVal = Number(o.discountValue ?? o.value ?? 0);
                const rawType = (o.offerType || o.type || "").toUpperCase();

                let discountBadge = "";
                if (rawType.includes("PERCENT") || rawType === "FLAT_PCT") {
                  discountBadge = discountVal > 0 ? `${discountVal}% OFF` : "DISCOUNT";
                } else if (rawType.includes("BOGO") || rawType.includes("BUY_X_GET_Y")) {
                  discountBadge = (o.buyQuantity && o.getQuantity) ? `BUY ${o.buyQuantity} GET ${o.getQuantity}` : "BUY 1 GET 1";
                } else if (rawType.includes("CASHBACK")) {
                  discountBadge = discountVal > 0 ? `₹${discountVal} CASHBACK` : "CASHBACK";
                } else {
                  discountBadge = discountVal > 0 ? `₹${discountVal} OFF` : "SPECIAL";
                }

                const cap = Number(o.maxDiscountAmount ?? 0);
                const minBill = Number(o.minimumOrderAmount ?? o.minTransactionAmount ?? 0);

                const offerHeadline = o.title && !o.title.toLowerCase().includes("sample")
                  ? o.title
                  : (discountVal > 0 ? `Flat ${discountVal}% OFF on Total Bill` : "Special Dine-in Offer");

                let conditionText = "";
                if (cap > 0 && minBill > 0) {
                  conditionText = `Up to ₹${cap.toLocaleString("en-IN")} • On bills above ₹${minBill.toLocaleString("en-IN")}`;
                } else if (cap > 0) {
                  conditionText = `Up to ₹${cap.toLocaleString("en-IN")} • No min spend`;
                } else if (minBill > 0) {
                  conditionText = `On bills above ₹${minBill.toLocaleString("en-IN")}`;
                } else if (o.subtitle) {
                  conditionText = o.subtitle;
                } else {
                  conditionText = "Available on all days";
                }

                const rType = (o.redemptionType || "").toUpperCase();
                const isBoth = rType === "BOTH";
                const isWalkInOnly = rType === "WALK_IN";
                const isPreBookingOnly = rType === "PRE_BOOK" || (!isBoth && !isWalkInOnly);

                const expiry = o.expiresAt || o.validTo;
                const badge = formatTimeLeftBadge(expiry);
                const rewardCoins = o.reward?.coins || o.rewardSummary?.coins || o.bonusCoins || 100;
                const imageSrc = o.imageUrl || o.imgUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

                const targetStoreId = o.branch?.branchId || o.branchSummary?.storeId || o.storeId;

                return (
                  <article
                    key={offerKey}
                    onClick={() => {
                      setInitialDetailView("detail");
                      handleOpenStoreDetail(targetStoreId);
                    }}
                    className="w-72 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group h-[335px]"
                  >
                    <div className="flex-1 flex flex-col">
                      {/* Card Thumbnail */}
                      <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                        <img
                          alt={storeDisplayName}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          src={imageSrc}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        {/* Gradient Scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                        {/* Top Left Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          <span className="bg-purple-600/95 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs tracking-wider uppercase">
                            <Sparkles size={9} className="fill-white" />
                            <span>{o.badgeText || "PINAK EXCLUSIVE"}</span>
                          </span>
                          <span className={`${badge.bg} backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs`}>
                            <Clock size={9} className="stroke-[2.5]" />
                            <span>{badge.text}</span>
                          </span>
                        </div>

                        {/* Favorite Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(offerKey, e)}
                          aria-label="Favorite"
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
                        >
                          <Heart
                            size={13}
                            className={favorites[offerKey] ? "fill-rose-500 text-rose-500" : "text-white"}
                          />
                        </button>

                        {/* Bottom Overlay Info (Rating & Redemption Badge) */}
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] font-bold z-10">
                          <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star size={11} className="fill-amber-400 text-amber-400" />
                            <span>4.8</span>
                            <span className="text-slate-300 font-normal text-[9px]">(1.2k)</span>
                          </span>
                          {isBoth ? (
                            <span className="bg-gradient-to-r from-purple-700 to-indigo-700 backdrop-blur-xs text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[9.5px] font-extrabold shadow-xs whitespace-nowrap shrink-0">
                              <Sparkles size={10} className="fill-amber-300 text-amber-300 shrink-0" />
                              <span className="whitespace-nowrap">Pre-Book & Walk-in</span>
                            </span>
                          ) : isWalkInOnly ? (
                            <span className="bg-blue-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[9.5px] font-extrabold shadow-xs whitespace-nowrap shrink-0">
                              <Store size={10} className="shrink-0" />
                              <span className="whitespace-nowrap">Walk-in Offer</span>
                            </span>
                          ) : (
                            <span className="bg-emerald-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[9.5px] font-extrabold shadow-xs whitespace-nowrap shrink-0">
                              <UtensilsCrossed size={10} className="shrink-0" />
                              <span className="whitespace-nowrap">Table Pre-Booking</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body with Fixed Sub-containers for Uniform Height */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        {/* Store & Locality */}
                        <div>
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white truncate" title={storeDisplayName}>
                              {storeDisplayName}
                            </h3>
                            <CheckCircle2 size={13} className="text-blue-500 shrink-0 fill-blue-500 text-white" />
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <MapPin size={10} className="shrink-0 text-slate-400" />
                            <span>{distanceText}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">Dine-in Outlet</span>
                          </p>
                        </div>

                        {/* Deal Highlight Box: Fixed Height */}
                        <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-2.5 h-[52px] flex flex-col justify-center">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 leading-tight truncate">
                              {offerHeadline}
                            </p>
                            <span className="shrink-0 ml-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                              {discountBadge}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-emerald-700 dark:text-emerald-400 font-medium truncate mt-0.5">
                            {conditionText}
                          </p>
                        </div>

                        {/* Redemption Info Pills: Pre-Booking, Walk-in, or Both: Fixed Height */}
                        <div className="h-6 flex items-center gap-1.5 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                          {isBoth ? (
                            <>
                              <span className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Users size={9} />
                                <span>Pre-book</span>
                              </span>
                              <span className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Store size={9} />
                                <span>Walk-in</span>
                              </span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                                Instant Deals
                              </span>
                            </>
                          ) : isWalkInOnly ? (
                            <>
                              <span className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Store size={9} />
                                <span>Walk-in Direct</span>
                              </span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <QrCode size={9} />
                                <span>Scan & Pay</span>
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md">
                                Zero Advance
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Users size={9} />
                                <span>Party 2-6</span>
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={9} />
                                <span>15m Grace</span>
                              </span>
                              <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md">
                                Free Reservation
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 h-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                          🪙 +{rewardCoins} Coins
                        </span>
                        <span className="text-[8.5px] text-slate-400">on PINAK Bill Pay</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPreBookingOnly || isBoth) {
                            setInitialDetailView("booking");
                          } else {
                            setInitialDetailView("detail");
                          }
                          handleOpenStoreDetail(targetStoreId);
                        }}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{o.ctaText || (isWalkInOnly ? "Pay Bill" : isBoth ? "Book & Pay" : "Book Table")}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* TOP PRODUCT DEALS NEAR YOU (CONNECTED TO BACKEND API) */}
          {/* ========================================================= */}
          <section className="mb-5" data-purpose="product-deals-carousel">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-slate-900 leading-none">
                    Top Product Deals Near You
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Database Feed"></span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Groceries, electronics, hardware &amp; daily essentials at the best prices
                </p>
              </div>
              <div className="flex items-center space-x-0.5 text-[11px] font-bold text-purple-700 cursor-pointer">
                <span>View All ({displayedProductDeals.length})</span>
                <ChevronRight size={13} />
              </div>
            </div>

            {/* Horizontal Product Card Rail or Empty State */}
            {displayedProductDeals.length === 0 ? (
              <div className="mx-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-xs text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <ShoppingBag size={18} />
                </div>
                <p className="text-xs font-bold text-slate-800">No Product Deals Nearby</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  No retail product deals are active in this area right now.
                </p>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar px-4 py-1">
                {displayedProductDeals.map((p) => {
                const prodKey = p.id;
                const qty = cart[prodKey] || 0;
                const isBogo = p.discountBadge?.toLowerCase().includes("buy") || p.discountBadge?.toLowerCase().includes("bogo");
                return (
                  <div
                    key={prodKey}
                    className="w-36 shrink-0 bg-white rounded-xl border border-slate-100 p-2.5 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-shadow group"
                  >
                    <span
                      className={cn(
                        "absolute top-2 left-2 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-md z-10 shadow-2xs",
                        isBogo ? "bg-amber-500" : "bg-rose-500"
                      )}
                    >
                      {p.discountBadge || `${p.discountPct}% OFF`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(prodKey, e)}
                      aria-label="Favorite"
                      className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 z-10 transition-colors cursor-pointer"
                    >
                      <Heart
                        size={14}
                        className={favorites[prodKey] ? "fill-rose-500 text-rose-500" : "text-slate-300"}
                      />
                    </button>
                    <div
                      className="h-24 w-full flex items-center justify-center p-2 mb-1 bg-white rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => p.storeId && handleOpenStoreDetail(p.storeId)}
                    >
                      <img
                        alt={p.title}
                        className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                        src={p.imageUrl}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>
                    <div>
                      <h4
                        className="text-[11px] font-bold text-slate-800 truncate cursor-pointer hover:text-purple-700"
                        title={p.title}
                        onClick={() => p.storeId && handleOpenStoreDetail(p.storeId)}
                      >
                        {p.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 mb-1 truncate">
                        {p.unitOrWeight || (p.storeName ? `${p.storeName}` : "Standard Pack")}
                      </p>
                      <div className="flex items-baseline space-x-1 mb-2">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          ₹{p.dealPrice}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[9px] text-slate-400 line-through font-mono">
                            ₹{p.originalPrice}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCart((prev) => {
                            const next = (prev[prodKey] || 0) + 1;
                            toast.success(`Added "${p.title}" to cart! (${next} in cart)`, {
                              description: `Store deal: ₹${p.dealPrice} ${p.originalPrice ? `(MRP ₹${p.originalPrice})` : ""}`
                            });
                            return { ...prev, [prodKey]: next };
                          });
                        }}
                        className={cn(
                          "w-full py-1.5 border rounded-lg text-[10px] font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer active:scale-95 shadow-2xs",
                          qty > 0
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20"
                            : "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                        )}
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>{qty > 0 ? `In Cart (${qty})` : "Add to Cart"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* FEATURED STORES FOR ALL YOUR NEEDS (CONNECTED TO BACKEND API) */}
          {/* ========================================================= */}
          <section className="mb-5" data-purpose="featured-stores">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 flex items-center justify-center text-xs">
                  🏬
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">Featured Stores for All Your Needs</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">From restaurants to supermarkets, kirana, electronics &amp; more</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info(`Viewing all ${displayedFeaturedStores.length} partner stores`)}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-0.5 cursor-pointer"
              >
                <span>View All Stores</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Horizontal Stores Rail or Empty State */}
            {displayedFeaturedStores.length === 0 ? (
              <div className="mx-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-xs text-center">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Store size={18} />
                </div>
                <p className="text-xs font-bold text-slate-800">No Featured Stores Nearby</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Partner stores will appear here once registered and verified.
                </p>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar px-4 py-1">
                {displayedFeaturedStores.map((store) => {
                const storeKey = store.merchantId;
                const { initials, bg: brandBg } = getStoreInitialsAndColor(store.name);
                const { text: badgeText, bg: badgeBg } = getStoreBadgeTextAndBg(store.bestOffer?.label);
                const distanceText = store.distanceMeters != null
                  ? (store.distanceMeters < 1000 ? `${store.distanceMeters}m` : `${(store.distanceMeters / 1000).toFixed(1)}km`)
                  : "Nearby";

                return (
                  <article
                    key={storeKey}
                    onClick={() => {
                      handleOpenStoreDetail(store.merchantId);
                    }}
                    className="w-48 shrink-0 bg-white rounded-xl border border-slate-100 p-2.5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-20 rounded-lg overflow-hidden mb-2">
                        <img
                          alt={store.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          src={store.coverImageUrl || store.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80";
                          }}
                        />
                        <span className={cn("absolute top-1.5 left-1.5 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs", badgeBg)}>
                          {badgeText}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(storeKey, e)}
                          aria-label="Favorite"
                          className="absolute top-1.5 right-1.5 text-white/90 hover:text-rose-500 z-10 transition-colors drop-shadow-sm cursor-pointer"
                        >
                          <Heart
                            size={14}
                            className={favorites[storeKey] ? "fill-rose-500 text-rose-500" : "text-white"}
                          />
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 mb-1.5">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0", brandBg)}>
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={store.name}>
                            {store.name}
                          </h4>
                          <p className="text-[9px] text-slate-400 truncate">
                            {store.categoryName || "Store"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-[9px] text-slate-500 mb-1.5">
                        <span className="flex items-center text-amber-600 font-bold">★ {store.rating?.average ? store.rating.average.toFixed(1) : "4.5"}</span>
                        <span>• {distanceText}</span>
                      </div>
                    </div>

                    <div className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 rounded-md px-1.5 py-0.5 flex items-center truncate mt-1">
                      🏷️ {store.bestOffer?.label || "Special offers available"}
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* POPULAR CURATED COLLECTIONS (CONNECTED TO BACKEND API) */}
          {/* ========================================================= */}
          <section className="mb-5" data-purpose="popular-collections">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                  ✨
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-none">Popular Collections</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Handpicked selections for you</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast.info(`Browsing all ${displayedCollections.length} curated collections`)}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-0.5 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Horizontal Cards for Curated Collections or Empty State */}
            {displayedCollections.length === 0 ? (
              <div className="mx-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-xs text-center">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
                  <Sparkles size={18} />
                </div>
                <p className="text-xs font-bold text-slate-800">No Collections Available</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Curated collections will appear here once configured.
                </p>
              </div>
            ) : (
              <div className="flex space-x-3 overflow-x-auto no-scrollbar px-4 py-1">
                {displayedCollections.map((col) => {
                const { bg, text } = getCollectionGradient(col.title);
                return (
                  <div
                    key={col.id}
                    onClick={() => toast.info(`Viewing collection: ${col.title}`, { description: col.badgeText })}
                    className={cn(
                      "w-44 shrink-0 bg-gradient-to-br border rounded-xl p-2.5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group cursor-pointer",
                      bg
                    )}
                  >
                    <div className="h-20 w-full rounded-lg overflow-hidden mb-2">
                      <img
                        alt={col.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        src={col.coverImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{col.title}</h4>
                        <p className={cn("text-[9px] font-bold truncate", text)}>{col.badgeText || "Explore Offers"}</p>
                      </div>
                      <button className="w-5 h-5 rounded-md bg-white shadow-xs flex items-center justify-center text-slate-700 text-xs shrink-0 cursor-pointer">
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* RECENTLY VIEWED (LIVE USER HISTORY) */}
          {/* ========================================================= */}
          {recentlyViewed.length > 0 && (
            <section className="mb-5" data-purpose="recently-viewed">
              <div className="flex justify-between items-center px-4 mb-2.5">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs">
                    🕒
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-none">Recently Viewed</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Continue shopping or explore similar products</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Showing your recent item browsing history")}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Horizontal Mini Items Rail */}
              <div className="flex space-x-3 overflow-x-auto no-scrollbar px-4 py-1">
                {recentlyViewed.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toast.info(`Selected "${item.title}"`, { description: `Store price: ₹${item.dealPrice}` })}
                    className="w-32 shrink-0 bg-white rounded-xl border border-slate-100 p-2 shadow-2xs relative hover:shadow-sm transition-shadow group cursor-pointer"
                  >
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(item.id, e)}
                      aria-label="Favorite"
                      className="absolute top-1.5 right-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Heart
                        size={12}
                        className={favorites[item.id] ? "fill-rose-500 text-rose-500" : "text-slate-300"}
                      />
                    </button>
                    <div className="h-16 w-full flex items-center justify-center p-1 mb-1">
                      <img
                        alt={item.title}
                        className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                        src={item.imageUrl}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
                        }}
                      />
                    </div>
                    <h5 className="text-[10px] font-bold text-slate-800 truncate">{item.title}</h5>
                    <p className="text-[8px] text-slate-400 truncate">{item.unit}</p>
                    <div className="flex items-baseline space-x-1 mt-0.5">
                      <span className="text-[11px] font-bold text-slate-900 font-mono">₹{item.dealPrice}</span>
                      <span className="text-[8px] text-slate-400 line-through font-mono">₹{item.originalPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* RECOMMENDED FOR YOU (LIVE API RECOMMENDATIONS) */}
          {/* ========================================================= */}
          {recommendations.length > 0 && (
            <section className="mb-5" data-purpose="recommended-for-you">
              <div className="flex justify-between items-center px-4 mb-2.5">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded-md bg-pink-100 text-pink-600 flex items-center justify-center text-xs">
                    ❤️
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-none">Recommended for You</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Based on your interests and nearby availability</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Opening personalized recommendations")}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Recommendation Cards */}
              <div className="flex space-x-3.5 overflow-x-auto no-scrollbar px-4 py-1">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => toast.success(`Selected ${rec.title}`, { description: rec.discountBadge })}
                    className="w-56 shrink-0 bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow group cursor-pointer"
                  >
                    <div className="relative h-24">
                      <img
                        alt={rec.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        src={rec.imageUrl}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80";
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-indigo-900/80 backdrop-blur-xs text-white text-[8px] font-semibold px-2 py-0.5 rounded-md">
                        {rec.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(rec.id, e)}
                        aria-label="Favorite"
                        className="absolute top-2 right-2 text-white/90 hover:text-rose-500 transition-colors drop-shadow-sm cursor-pointer"
                      >
                        <Heart
                          size={14}
                          className={favorites[rec.id] ? "fill-rose-500 text-rose-500" : "text-white"}
                        />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{rec.title}</h4>
                      <p className="text-[9px] text-slate-500 mb-2 truncate">{rec.distanceCategory}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center">
                          🏷️ {rec.discountBadge}
                        </span>
                        <button className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs shrink-0 cursor-pointer">
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flash Deals Ending Soon Block */}
          {flashDeals.length > 0 && (
            <section className="px-4 mb-5">
              <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-700 p-4 text-white shadow-md relative overflow-hidden rounded-xl">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-amber-300 text-lg">⚡</span>
                  <h3 className="text-sm font-extrabold tracking-tight">Flash Deals Ending Soon!</h3>
                </div>
                <p className="text-[10px] text-purple-200 mb-3">Grab these offers before they're gone</p>

                {/* Timer Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1.5">
                    <div className="bg-black/35 backdrop-blur-xs rounded-lg px-2 py-1 text-center min-w-[34px]">
                      <span className="text-xs font-black block leading-none">04</span>
                      <span className="text-[7px] text-purple-200 font-medium">Hours</span>
                    </div>
                    <span className="font-bold text-xs">:</span>
                    <div className="bg-black/35 backdrop-blur-xs rounded-lg px-2 py-1 text-center min-w-[34px]">
                      <span className="text-xs font-black block leading-none">32</span>
                      <span className="text-[7px] text-purple-200 font-medium">Mins</span>
                    </div>
                    <span className="font-bold text-xs">:</span>
                    <div className="bg-black/35 backdrop-blur-xs rounded-lg px-2 py-1 text-center min-w-[34px]">
                      <span className="text-xs font-black block leading-none">
                        {seconds < 10 ? `0${seconds}` : seconds}
                      </span>
                      <span className="text-[7px] text-purple-200 font-medium">Secs</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.info(`Viewing all ${flashDeals.length} live flash deals`)}
                    className="bg-white text-purple-950 text-[10px] font-extrabold px-3 py-1.5 flex items-center space-x-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    <span>View All Deals</span>
                  </button>
                </div>

                {/* Live Flash Deal Cards Rail */}
                <div className="flex space-x-2.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                  {flashDeals.map((deal) => (
                    <div
                      key={deal.offerId}
                      onClick={() => toast.info(`Claimed Flash Deal: ${deal.title}`)}
                      className="w-36 shrink-0 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-2 flex flex-col justify-between transition-all group cursor-pointer"
                    >
                      <div className="relative h-20 w-full rounded-lg overflow-hidden mb-1.5 bg-black/20">
                        <img
                          src={deal.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"}
                          alt={deal.title}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        {deal.badgeText && (
                          <span className="absolute top-1 left-1 bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded shadow-xs">
                            {deal.badgeText}
                          </span>
                        )}
                        {deal.remainingQuantity !== undefined && (
                          <span className="absolute bottom-1 right-1 bg-red-600/90 text-white text-[7px] font-bold px-1 rounded">
                            {deal.remainingQuantity} left
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white truncate leading-tight mb-1">
                          {deal.title}
                        </h4>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-xs font-black text-amber-300">
                            ₹{deal.price?.sellingPrice ?? 0}
                          </span>
                          {deal.price?.mrp && (
                            <span className="text-[9px] text-purple-200/80 line-through">
                              ₹{deal.price.mrp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Trust Badges */}
          <section className="px-4 mb-4">
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
              <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-none">Why Shop on PINAK?</h4>
                  <p className="text-[9px] text-slate-500">Safe, Local & Rewarding</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-none">Verified Stores</p>
                    <p className="text-[8px] text-slate-400">Only trusted partners</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">🪙</span>
                  <div>
                    <p className="text-[10px] font-bold text-slate-800 leading-none">Earn Coins</p>
                    <p className="text-[8px] text-slate-400">On every purchase</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
            </>
          )}

          {/* Floating Active Booking Card(s) - Matches Swiggy/Dineout Style with Multi-Booking Swipe */}
          {activeScreen === "home" && visibleBookings.length > 0 && (
            <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[395px] z-40 animate-in slide-in-from-bottom-3 duration-300">
              {/* Carousel container with CSS snap */}
              <div
                ref={carouselRef}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const idx = Math.round(target.scrollLeft / (target.clientWidth || 1));
                  if (idx !== activeBookingCarouselIndex && idx >= 0 && idx < visibleBookings.length) {
                    setActiveBookingCarouselIndex(idx);
                  }
                }}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar w-full rounded-2xl shadow-xl shadow-slate-900/10 border border-emerald-300/80 dark:border-emerald-800/80 bg-white dark:bg-slate-900"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {visibleBookings.map((b, idx) => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isToday =
                    b.bookingDate === todayStr || (b.bookingDate && b.bookingDate.startsWith(todayStr));
                  const displayDate = isToday ? "Today" : b.formattedDate || b.bookingDate;

                  return (
                    <div
                      key={b.bookingRef || b.bookingId || idx}
                      onClick={() => {
                        setSelectedBookingForPass(b);
                        setActiveBooking(b);
                        setActiveScreen("booking_pass");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full shrink-0 snap-center cursor-pointer transition-all hover:scale-[1.005] active:scale-[0.995]"
                    >
                      {/* Top Mint-Green Offer Banner */}
                      <div className="bg-[#d4f8e8] dark:bg-emerald-950/70 px-3 py-1.5 flex items-center justify-between gap-1.5 border-b border-emerald-200/60 dark:border-emerald-900/50">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Percent size={10} className="stroke-[3]" />
                          </span>
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 tracking-tight truncate">
                            {b.discountPct && Number(b.discountPct) > 0
                              ? `Flat ${Math.round(Number(b.discountPct))}% off on total bill`
                              : b.offerTitle || "Flat 15% off on total bill"}
                          </span>
                        </div>

                        {/* Right: Multi-card indicator + Dismiss Button */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {visibleBookings.length > 1 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 tracking-tight">
                              Swipe • {idx + 1}/{visibleBookings.length}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDismissedBookingRefs((prev) => {
                                const next = new Set(prev);
                                next.add(b.bookingRef || b.bookingId);
                                return next;
                              });
                              toast.info("Reservation card dismissed");
                            }}
                            className="w-6 h-6 rounded-full bg-slate-200/70 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 flex items-center justify-center shrink-0 transition cursor-pointer"
                            title="Dismiss this booking card"
                          >
                            <X size={13} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Restaurant Info */}
                      <div className="px-3 py-2 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <img
                            src={
                              b.coverImageUrl ||
                              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80"
                            }
                            alt={b.storeName || "Restaurant"}
                            className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate leading-tight">
                              {b.storeName}
                              {b.storeAddress ? `, ${b.storeAddress.split(",")[0]}` : ""}
                            </p>
                            <p className="text-[12px] font-black text-slate-900 dark:text-white truncate leading-snug mt-0.5">
                              Booked for {displayDate}
                              {b.slotTime ? `, ${b.slotTime}` : ""}
                              {b.guests ? ` • ${b.guests} Guests` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Navigation chevron buttons (Only if multiple bookings) */}
                        {visibleBookings.length > 1 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const prevIdx = Math.max(0, idx - 1);
                                carouselRef.current?.scrollTo({
                                  left: prevIdx * (carouselRef.current?.clientWidth || 0),
                                  behavior: "smooth"
                                });
                                setActiveBookingCarouselIndex(prevIdx);
                              }}
                              disabled={idx === 0}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer",
                                idx === 0
                                  ? "opacity-20 cursor-not-allowed text-slate-400"
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                              )}
                              title="Previous reservation"
                            >
                              <ChevronLeft size={14} className="stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextIdx = Math.min(visibleBookings.length - 1, idx + 1);
                                carouselRef.current?.scrollTo({
                                  left: nextIdx * (carouselRef.current?.clientWidth || 0),
                                  behavior: "smooth"
                                });
                                setActiveBookingCarouselIndex(nextIdx);
                              }}
                              disabled={idx === visibleBookings.length - 1}
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer",
                                idx === visibleBookings.length - 1
                                  ? "opacity-20 cursor-not-allowed text-slate-400"
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                              )}
                              title="Next reservation"
                            >
                              <ChevronRight size={14} className="stroke-[2.5]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dot Indicators (if multiple) */}
              {visibleBookings.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1.5">
                  {visibleBookings.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        carouselRef.current?.scrollTo({
                          left: i * (carouselRef.current?.clientWidth || 0),
                          behavior: "smooth"
                        });
                        setActiveBookingCarouselIndex(i);
                      }}
                      className={cn(
                        "transition-all duration-200 rounded-full cursor-pointer",
                        activeBookingCarouselIndex === i
                          ? "w-4 h-1.5 bg-emerald-600 dark:bg-emerald-400"
                          : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                      )}
                      title={`Go to booking ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Fixed Navigation Bar (Discovery & Orders) */}
          {activeScreen !== "detail" && activeScreen !== "booking_pass" && !isPayingBill && (
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 z-50 flex items-center justify-around shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex flex-col items-center space-y-0.5 min-w-[54px] cursor-pointer transition-colors",
                  activeScreen === "home" ? "text-purple-700" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Compass size={20} />
                <span className={cn("text-[9px]", activeScreen === "home" ? "font-bold" : "font-medium")}>Discover</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.info("Showing exclusive dining & retail offers");
                  setActiveScreen("home");
                }}
                className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px] cursor-pointer transition-colors"
              >
                <Tag size={20} />
                <span className="text-[9px] font-medium">Deals</span>
              </button>
              {/* Scan & Pay Center Button */}
              <div className="relative -top-5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => toast.info("Opening In-Store UPI QR Scanner")}
                  className="w-13 h-13 p-3 bg-purple-700 hover:bg-purple-800 text-white shadow-lg flex items-center justify-center rounded-xl transition-transform active:scale-95 cursor-pointer"
                >
                  <QrCode size={24} />
                </button>
                <span className="text-[9px] font-bold text-purple-950 mt-1">Scan & Pay</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveScreen("orders");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex flex-col items-center space-y-0.5 min-w-[54px] cursor-pointer transition-colors",
                  activeScreen === "orders" ? "text-purple-700" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <TicketPercent size={20} />
                <span className={cn("text-[9px]", activeScreen === "orders" ? "font-bold" : "font-medium")}>Orders</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info("Pocket & Saved vouchers")}
                className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px] cursor-pointer transition-colors"
              >
                <User size={20} />
                <span className="text-[9px] font-medium">Pocket</span>
              </button>
            </nav>
          )}
        </div>
      </main>
    </div>
  );
}
