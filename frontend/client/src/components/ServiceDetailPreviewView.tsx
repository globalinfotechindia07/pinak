import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  Star,
  Compass,
  Phone,
  Sparkles,
  Bolt,
  CreditCard,
  Check,
  Info,
  Utensils,
  BookOpen,
  MapPin,
  Navigation,
  ExternalLink,
  Headphones,
  Clock,
  X,
  Plus,
  Minus,
  QrCode,
  ShieldCheck,
  Wine,
  Car,
  CalendarCheck,
  Calendar,
  Users,
  Wifi,
  Fan,
  Music,
  Store,
  Loader2,
  Coins,
  Wallet,
  CheckCircle,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";

interface ServiceDetailData {
  id: string;
  storeName: string;
  merchantName: string;
  isVerified: boolean;
  coverImageUrl: string;
  heroPhotos: string[];
  totalPhotosCount: number;
  photoCounterText: string;
  distanceMeters: number;
  distanceText: string;
  cuisines: string;
  priceForTwoText: string;
  cuisineAndPriceText: string;
  rating: number;
  ratingCountText: string;
  isOpenNow: boolean;
  openStatusText: string;
  openingTime: string;
  closingTime: string;
  phone: string;
  latitude: number;
  longitude: number;
  address: string;
  googleMapsUrl: string;
  coinPerkBanner: {
    multiplier?: string;
    title: string;
    tag?: string;
  };
  availableTabs: string[];
  offersSection: {
    activeOffersCountText: string;
    primaryOffer: any;
    preBookingOffers: any[];
    walkInOffers: any[];
    productOffers?: any[];
    partnerIncentiveChips?: any[];
    greenPerkHighlight?: string;
  };
  flashSales: {
    title: string;
    badge: string;
    viewAllText: string;
    deals: any[];
  };
  productsSection?: {
    title: string;
    subtitle: string;
    totalCount: number;
    items: Array<{
      id: string;
      name: string;
      brand: string;
      unit: string;
      imageUrl: string;
      mrp: number;
      sellingPrice: number;
      discountPercent: number;
      discountBadge: string;
      inStock: boolean;
      offerId?: string;
    }>;
  };
  menuSection: {
    categoryTitle: string;
    items: any[];
    menuPagesText: string;
    totalPagesCount: number;
    menuImages: string[];
  };
  photoMosaic: {
    primaryPhoto: string;
    secondaryPhotos: string[];
    additionalCountText: string;
    totalPhotosCount: number;
    allPhotos: string[];
  };
  amenities: Array<{ label: string; icon: string }>;
  locationSection: {
    addressLine1: string;
    addressLine2: string;
    fullAddress: string;
    distanceText: string;
    distanceMeters: number;
    mapPreviewImageUrl: string;
    latitude: number;
    longitude: number;
    googleMapsUrl: string;
  };
  concierge: {
    title: string;
    subtitle: string;
    phone: string;
    actionType: string;
  };
  similarPlaces: any[];
  bottomBar: {
    rewardTeaser: {
      icon: string;
      text: string;
      badge: string;
    };
    isTableBookingEnabled: boolean;
    primaryAction: {
      type: string;
      label: string;
      discountBadge?: string;
      enabled: boolean;
    };
    secondaryAction: {
      type: string;
      label: string;
      enabled: boolean;
    };
  };
}

interface ServiceDetailPreviewViewProps {
  storeId?: string;
  userLat?: number;
  userLng?: number;
  onBack: () => void;
}

interface StoreLocationMapProps {
  latitude?: number;
  longitude?: number;
  storeName?: string;
  onClick?: () => void;
}

const StoreLocationMap: React.FC<StoreLocationMapProps> = ({
  latitude,
  longitude,
  storeName,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const initialLat = Number.isFinite(latitude) && latitude !== 0 ? latitude! : 21.1458;
  const initialLng = Number.isFinite(longitude) && longitude !== 0 ? longitude! : 79.0882;

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.setView([initialLat, initialLng], 15);
      return;
    }

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Zoom controls matching StoreLocationPicker from store creation
    L.control.zoom({ position: "topright" }).addTo(map);

    // Luxury SVG Pin matching StoreLocationPicker from store creation
    const pinIcon = L.divIcon({
      className: "custom-store-pin",
      html: `
        <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 12px rgba(124, 58, 237, 0.45));">
            <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 18 44 18 44C18 44 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="url(#pin_gradient_detail)"/>
            <circle cx="18" cy="17" r="7" fill="white"/>
            <circle cx="18" cy="17" r="3.5" fill="#7C3AED"/>
            <defs>
              <linearGradient id="pin_gradient_detail" x1="0" y1="0" x2="36" y2="44" gradientUnits="userSpaceOnUse">
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

    const marker = L.marker([initialLat, initialLng], { icon: pinIcon }).addTo(map);
    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 11px; padding: 2px;">
        <strong style="color: #7C3AED; display: block; margin-bottom: 2px;">📍 ${storeName || "Store Location"}</strong>
        <span style="color: #64748B;">Tap Navigate for turn-by-turn directions</span>
      </div>
    `);

    mapRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng, storeName]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full z-0"
    />
  );
};

export const ServiceDetailPreviewView: React.FC<ServiceDetailPreviewViewProps> = ({
  storeId,
  userLat = 12.9716,
  userLng = 77.6412,
  onBack
}) => {
  const [data, setData] = useState<ServiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerSegment, setOfferSegment] = useState<"PRE_BOOK" | "WALK_IN" | "PRODUCT">("PRE_BOOK");
  const [activeTab, setActiveTab] = useState("Offers");
  const [isFavorited, setIsFavorited] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedImageZoom, setSelectedImageZoom] = useState<string | null>(null);

  // Production-Ready Interactive Booking, Payment & Product Sheet States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductForDeal, setSelectedProductForDeal] = useState<any>(null);
  const [productOrderQuantity, setProductOrderQuantity] = useState<number>(1);
  const [selectedGuests, setSelectedGuests] = useState<number>(2);
  const [selectedDate, setSelectedDate] = useState<string>("Today");
  const [selectedSlot, setSelectedSlot] = useState<string>("07:30 PM");
  const [enteredBillAmount, setEnteredBillAmount] = useState<number>(1000);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("UPI");
  const [activeOfferIndex, setActiveOfferIndex] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const DEFAULT_STORE_ID = "97aabe53-9349-439d-952e-40f723bb8f51";
  const effectiveStoreId = storeId && storeId !== "undefined" && storeId !== "null" ? storeId : DEFAULT_STORE_ID;

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<any>(
          `/mobile/stores/${effectiveStoreId}/detail?lat=${userLat}&lng=${userLng}`
        );
        if (isMounted) {
          if (res.data?.success && res.data?.data) {
            setData(res.data.data);
            const po = res.data.data.offersSection?.primaryOffer;
            if (po?.minPartySize) {
              setSelectedGuests(po.minPartySize);
            }
            if (po?.slotTimes) {
              try {
                const slots = typeof po.slotTimes === "string" ? JSON.parse(po.slotTimes) : po.slotTimes;
                if (Array.isArray(slots) && slots.length > 0) {
                  setSelectedSlot(slots[0]);
                }
              } catch {
                // Keep default
              }
            }
            if (po?.minimumOrderAmount) {
              setEnteredBillAmount(Number(po.minimumOrderAmount));
            }
          } else {
            setError(res.data?.message || "Failed to load store detail from database");
          }
        }
      } catch (err: any) {
        console.error("Could not load store detail from backend API:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Store details could not be loaded from database.");
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [effectiveStoreId, userLat, userLng]);

  // Sync active offer segment automatically to match available store offers (Restaurant vs Kirana vs Hybrid)
  useEffect(() => {
    if (data?.offersSection) {
      const hasPre = (data.offersSection.preBookingOffers?.length || 0) > 0;
      const hasWalk = (data.offersSection.walkInOffers?.length || 0) > 0;
      const hasProd = (data.offersSection.productOffers?.length || 0) > 0;

      if (!hasPre && hasProd) {
        setOfferSegment("PRODUCT");
      } else if (hasPre) {
        setOfferSegment("PRE_BOOK");
      } else if (hasWalk) {
        setOfferSegment("WALK_IN");
      }
    }
  }, [data]);

  const handleShare = () => {
    if (!data) return;
    if (navigator.share) {
      navigator.share({
        title: data.storeName,
        text: `Check out ${data.storeName} on PINAK! ${data.cuisineAndPriceText}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDirections = () => {
    if (!data) return;
    const url = data.googleMapsUrl || `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (!data) return;
    if (data.phone) {
      window.location.href = `tel:${data.phone}`;
    } else {
      toast.info(`Contacting ${data.storeName} concierge support`);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    const tabMap: Record<string, string> = {
      Offers: "sec-offers",
      Products: "sec-products",
      Menu: "sec-menu",
      Photos: "sec-photos",
      Amenities: "sec-amenities",
      Location: "sec-location",
      "Similar Places": "sec-similar"
    };
    const targetId = tabMap[tab] || `sec-${tab.toLowerCase().replace(/\s+/g, "-")}`;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClaimDeal = (dealTitle: string) => {
    toast.success(`Offer Voucher Applied: "${dealTitle}"`, {
      description: "Auto-applied at checkout for instant savings."
    });
  };

  const renderAmenityIcon = (iconName: string) => {
    switch (iconName) {
      case "snowflake": return <Fan size={13} />;
      case "wifi": return <Wifi size={13} />;
      case "qrcode": return <QrCode size={13} />;
      case "square-parking": return <Car size={13} />;
      case "martini-glass": return <Wine size={13} />;
      case "calendar-check": return <CalendarCheck size={13} />;
      case "music": return <Music size={13} />;
      default: return <ShieldCheck size={13} />;
    }
  };

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="w-full bg-slate-50 text-slate-900 font-sans pb-28 relative animate-pulse">
        <div className="w-full h-64 bg-slate-200 dark:bg-slate-800" />
        <div className="px-4 -mt-6 relative z-10">
          <div className="h-10 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl" />
        </div>
        <div className="px-4 mt-4 space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  // Not Found / Error State
  if (!loading && (!data || error)) {
    return (
      <div className="w-full min-h-[420px] flex flex-col items-center justify-center p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm my-4 mx-auto max-w-md">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
          <Store size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Data Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          {error || "The selected store could not be found in the database. Please select a valid store."}
        </p>
        <button
          onClick={onBack}
          type="button"
          className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
        >
          <ArrowLeft size={14} /> Back to Discovery Feed
        </button>
      </div>
    );
  }

  if (!data) return null;

  const heroImage = data.coverImageUrl || data.heroPhotos?.[0] || "";
  const primaryOffer = data.offersSection?.primaryOffer;

  const preBookingOffers = data.offersSection?.preBookingOffers || [];
  const walkInOffers = data.offersSection?.walkInOffers || [];
  const productOffers = data.offersSection?.productOffers || [];
  const hasPreBooking = preBookingOffers.length > 0;
  const hasWalkIn = walkInOffers.length > 0;
  const hasProductDeals = productOffers.length > 0;

  // Segment switch tabs: when 3 or more tabs are shown, use concise labels ("Pre-booking", "Walk-in", "Product deals")
  // to prevent long text stacking/wrapping into two lines on mobile screens.
  const isMultiTab = [hasPreBooking, hasWalkIn, hasProductDeals].filter(Boolean).length >= 3;

  const segmentTabs = [
    ...(hasPreBooking
      ? [{ id: "PRE_BOOK" as const, label: isMultiTab ? "Pre-booking" : "Pre-booking offers" }]
      : []),
    ...(hasWalkIn
      ? [{ id: "WALK_IN" as const, label: isMultiTab ? "Walk-in" : "Walk-in offers" }]
      : []),
    ...(hasProductDeals
      ? [{ id: "PRODUCT" as const, label: "Product deals" }]
      : [])
  ];

  const activeSegmentOffers =
    offerSegment === "PRODUCT"
      ? productOffers
      : offerSegment === "WALK_IN"
      ? walkInOffers
      : preBookingOffers.length > 0
      ? preBookingOffers
      : productOffers.length > 0
      ? productOffers
      : walkInOffers;

  const currentHeroOffer = activeSegmentOffers[activeOfferIndex] || activeSegmentOffers[0] || primaryOffer;
  const additionalOffers = activeSegmentOffers.slice(1);

  // Active slots for booking modal
  let parsedSlots: string[] = ["12:30 PM", "01:00 PM", "01:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"];
  const targetOffer = currentHeroOffer || primaryOffer;
  if (targetOffer?.slotTimes) {
    try {
      const s = typeof targetOffer.slotTimes === "string" ? JSON.parse(targetOffer.slotTimes) : targetOffer.slotTimes;
      if (Array.isArray(s) && s.length > 0) parsedSlots = s;
    } catch {
      // fallback
    }
  }

  const minParty = targetOffer?.minPartySize || 2;
  const maxParty = targetOffer?.maxPartySize || 6;
  const bonusCoins = targetOffer?.bonusCoins || 100;
  const discountPct = Number(targetOffer?.discountValue || 50);
  const maxDiscountCap = Number(targetOffer?.maxDiscountAmount || 500);

  // Payment pass calculations
  const calculatedDiscount = Math.min(
    Math.round((enteredBillAmount * discountPct) / 100),
    maxDiscountCap
  );
  const finalPayable = Math.max(enteredBillAmount - calculatedDiscount, 0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40 && activeSegmentOffers.length > 1) {
      if (diff > 0) {
        setActiveOfferIndex((prev) => (prev < activeSegmentOffers.length - 1 ? prev + 1 : 0));
      } else {
        setActiveOfferIndex((prev) => (prev > 0 ? prev - 1 : activeSegmentOffers.length - 1));
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="w-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-32 relative">
      {/* ========================================================= */}
      {/* 1. HERO CAROUSEL & OVERLAY ACTIONS */}
      {/* ========================================================= */}
      <section className="relative bg-white dark:bg-slate-900 pb-4 border-b border-slate-200/90 dark:border-slate-800" data-purpose="restaurant-hero-overview">
        <div className="relative w-full h-64 bg-slate-900 overflow-hidden">
          {heroImage ? (
            <img
              alt={data.storeName}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              src={heroImage}
              onClick={() => setSelectedImageZoom(heroImage)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
              <Store size={48} className="mb-2 text-slate-500" />
              <span className="text-xs font-semibold">{data.storeName}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/45 pointer-events-none" />

          {/* Floating Top Bar Actions */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
            <button
              onClick={onBack}
              aria-label="Go back to Discovery Feed"
              className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center active:scale-95 transition shadow-sm border border-slate-100 cursor-pointer"
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFavorited(!isFavorited);
                  toast.success(isFavorited ? "Removed from saved places" : "Saved to your favorites!");
                }}
                aria-label="Favorite"
                className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-rose-500 flex items-center justify-center active:scale-95 transition shadow-sm border border-slate-100 cursor-pointer"
                type="button"
              >
                <Heart size={16} className={isFavorited ? "fill-rose-500 text-rose-500" : "text-rose-500"} />
              </button>
              <button
                onClick={handleShare}
                aria-label="Share"
                className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 flex items-center justify-center active:scale-95 transition shadow-sm border border-slate-100 cursor-pointer"
                type="button"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Image Counter Badge */}
          {data.totalPhotosCount > 0 && (
            <button
              onClick={() => data.heroPhotos?.length && setSelectedImageZoom(data.heroPhotos[0])}
              className="absolute bottom-9 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1.5 border border-white/20 cursor-pointer hover:bg-black/90"
            >
              <ImageIcon size={12} />
              <span>{data.photoCounterText || `1/${data.totalPhotosCount}`}</span>
            </button>
          )}
        </div>

        {/* 2. OVERLAID INCENTIVE BANNER */}
        {data.coinPerkBanner?.title && (
          <div className="px-4 -mt-6 relative z-10">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center border border-amber-500/40 shadow-xs">
                  {data.coinPerkBanner.multiplier || "2X"}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {data.coinPerkBanner.title}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
                {data.coinPerkBanner.tag || "AUTO-APPLY"}
              </span>
            </div>
          </div>
        )}

        {/* 3. RESTAURANT IDENTITY DETAILS */}
        <div className="px-4 mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {data.storeName}
                </h1>
                {data.isVerified && (
                  <CheckCircle2 size={16} className="text-purple-600 fill-purple-600 text-white shrink-0" />
                )}
              </div>
              {data.distanceText && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-medium">{data.distanceText}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                </div>
              )}
              {data.cuisineAndPriceText && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{data.cuisineAndPriceText}</p>
              )}
            </div>

            {/* Rating Box */}
            <div className="bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-center shrink-0 shadow-xs">
              <div className="flex items-center justify-center gap-1 font-bold text-sm leading-none">
                <span>{data.rating?.toFixed(1) || "4.8"}</span>
                <Star size={11} className="fill-white text-white" />
              </div>
              <div className="text-[8px] font-semibold tracking-tight text-white/95 mt-1 leading-none">
                {data.ratingCountText || "Verified"}
              </div>
            </div>
          </div>

          {/* Quick Status Pill & Action Buttons */}
          <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>{data.openStatusText || "Open Today"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirections}
                aria-label="Directions"
                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 hover:bg-slate-200 active:scale-95 transition text-xs font-semibold cursor-pointer"
                type="button"
              >
                <Compass size={14} className="text-purple-700" />
                <span>Directions</span>
              </button>
              {data.phone && (
                <button
                  onClick={handleCall}
                  aria-label="Call store"
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                  type="button"
                >
                  <Phone size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. STICKY HORIZONTAL NAVIGATION TABS (Interactive Scrolling) */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md border-y border-slate-200/90 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
        {(data.availableTabs || ["Offers", "Menu", "Photos", "Amenities", "Location"]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-purple-700 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800"
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 5. OFFERS FOR YOU (MATCHING EXACT REFERENCE SPECIFICATION) */}
      {/* ========================================================= */}
      <section id="sec-offers" className="px-4 pt-4 space-y-3" data-purpose="offers-for-you">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Offers for you</h2>

        {/* Main Offer Card Container: Compact & Uniform Dimensions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/90 dark:border-slate-800 relative overflow-hidden text-center min-h-[162px] flex flex-col justify-between">
          {/* Subtle Gift Voucher Watermark in bottom left */}
          <div className="absolute -bottom-3 -left-3 w-24 h-24 opacity-[0.04] text-purple-500 pointer-events-none select-none">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H16.82C16.93 3.7 17 3.36 17 3C17 1.34 15.66 0 14 0C12.89 0 11.93 0.61 11.41 1.5H12.59C12.07 0.61 11.11 0 10 0C8.34 0 7 1.34 7 3C7 3.36 7.07 3.7 7.18 4H4C2.9 4 2.01 4.9 2.01 6L2 20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V6C22 4.9 21.1 4 20 4ZM14 2C14.55 2 15 2.45 15 3C15 3.55 14.55 4 14 4H12.22C12.56 2.84 13.19 2 14 2ZM9 3C9 2.45 9.45 2 10 2C10.81 2 11.44 2.84 11.78 4H10C9.45 4 9 3.55 9 3ZM20 20H4V8H20V20Z" />
            </svg>
          </div>

          {/* Tab Selector: Pre-booking vs Walk-in vs Product offers */}
          {segmentTabs.length > 1 ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center justify-between mb-2.5 border border-slate-200/60 dark:border-slate-700/60 max-w-sm mx-auto gap-1">
              {segmentTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOfferSegment(tab.id)}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap min-h-[30px] flex items-center justify-center ${
                    offerSegment === tab.id
                      ? "bg-purple-700 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 font-semibold"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : segmentTabs.length === 1 ? (
            <div className="flex justify-center mb-2">
              <span className="px-3.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold tracking-tight">
                {segmentTabs[0].label}
              </span>
            </div>
          ) : null}

          {currentHeroOffer ? (
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              {/* Badges line: Dynamic based on offer's actual badges */}
              <div className="flex items-center justify-center gap-1.5 mb-1.5 flex-wrap h-5">
                {currentHeroOffer.badges && currentHeroOffer.badges.length > 0 ? (
                  currentHeroOffer.badges.map((b: string, i: number) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-slate-300 dark:text-slate-700 font-light text-[11px]">|</span>}
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1 font-black text-[10.5px] tracking-wider uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          <span className="font-black text-purple-700 dark:text-purple-300 lowercase tracking-normal text-xs font-sans">pinak</span>
                          <span className="font-extrabold text-[10px]">{b.replace(/pinak/gi, "").trim() || "EXCLUSIVE"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          {b}
                        </span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 font-black text-[10.5px] tracking-wider uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                    <span className="font-black text-purple-700 dark:text-purple-300 lowercase tracking-normal text-xs font-sans">pinak</span>
                    <span className="font-extrabold text-[10px]">EXCLUSIVE</span>
                  </span>
                )}
              </div>

              {/* Offer Title */}
              <div className="h-11 flex items-center justify-center relative px-6">
                {activeSegmentOffers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOfferIndex((prev) => (prev > 0 ? prev - 1 : activeSegmentOffers.length - 1));
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition shadow-xs cursor-pointer z-20 border border-slate-200/60 dark:border-slate-700/60"
                    title="Previous offer"
                  >
                    ‹
                  </button>
                )}

                <h3
                  onClick={() => setShowPaymentModal(true)}
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1 cursor-pointer hover:text-purple-700 transition group text-center line-clamp-2 leading-snug"
                >
                  <span>{currentHeroOffer.title}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black text-base group-hover:translate-x-1 transition-transform">›</span>
                </h3>

                {activeSegmentOffers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOfferIndex((prev) => (prev < activeSegmentOffers.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold transition shadow-xs cursor-pointer z-20 border border-slate-200/60 dark:border-slate-700/60"
                    title="Next offer"
                  >
                    ›
                  </button>
                )}
              </div>

              {/* Subtitle / Availability */}
              <div className="h-4 flex items-center justify-center mt-0.5">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px]">
                  {currentHeroOffer.subtitle || "Available on Mon-Sun"}
                </p>
              </div>

              {/* Carousel Dots Indicator */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {activeSegmentOffers.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveOfferIndex(idx)}
                    className={`transition-all cursor-pointer ${
                      activeOfferIndex === idx
                        ? "w-3.5 h-1.5 rounded-full bg-purple-700"
                        : "w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to offer ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3">No active offers available right now.</p>
          )}
        </div>

        {/* Plus Connector Badge */}
        <div className="relative flex justify-center -my-3 z-10">
          <div className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-black shadow-md border-2 border-white dark:border-slate-900">
            +
          </div>
        </div>

        {/* Combined Perks & DineCash Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Top Split Columns */}
          <div className="p-3.5 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 items-center">
            {/* Left: Cashback */}
            <div className="flex items-center gap-2.5 pr-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 font-black text-[10px] flex items-center justify-center shadow-xs shrink-0 border border-amber-400">
                2X
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {data.offersSection?.partnerIncentiveChips?.[0]?.title || "5% cashback"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {data.offersSection?.partnerIncentiveChips?.[0]?.subtitle || "on every bill payment"}
                </p>
              </div>
            </div>

            {/* Right: Bank / UPI Offer */}
            <div className="flex items-center gap-2.5 pl-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-black text-[10px] flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                UPI
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {data.offersSection?.partnerIncentiveChips?.[1]?.title || "Flat 10% off*"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {data.offersSection?.partnerIncentiveChips?.[1]?.subtitle || "use PINAKPAY"}
                </p>
              </div>
              {/* Dots */}
              <div className="flex gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>
              </div>
            </div>
          </div>

          {/* Attached Dark Perks Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold border-t border-purple-800/40">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-300 tracking-tight">PINAK Coins 2X</span>
              <span className="text-white/40">|</span>
              <span className="text-emerald-300 text-[11px]">
                {data.offersSection?.greenPerkHighlight || "Earn & Redeem 2X Coins on Bill"}
              </span>
            </div>
            <Info size={14} className="text-purple-200 cursor-pointer shrink-0" />
          </div>
        </div>

        {/* All Available Offers List (When multiple offers exist in this segment) */}
        {activeSegmentOffers.length > 1 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight uppercase">
                All Available Offers ({activeSegmentOffers.length})
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Swipe or tap to switch</span>
            </div>

            {activeSegmentOffers.map((off: any, idx: number) => {
              const isSelected = activeOfferIndex === idx;
              return (
                <div
                  key={off.id || idx}
                  onClick={() => {
                    setActiveOfferIndex(idx);
                    toast.info(`Switched to "${off.title}"`);
                  }}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border px-3.5 py-2.5 shadow-xs flex items-center justify-between gap-3 cursor-pointer transition h-[74px] ${
                    isSelected
                      ? "border-purple-600 ring-2 ring-purple-100 dark:ring-purple-950/50 bg-purple-50/20 dark:bg-purple-950/20"
                      : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1 flex flex-col justify-center h-full">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                        {off.redemptionType === "PRE_BOOK"
                          ? "PRE-BOOKING"
                          : off.redemptionType === "WALK_IN"
                          ? "WALK-IN"
                          : "ALL VISITS"}
                      </span>
                      {off.discountValue && (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {off.discountValue}% OFF
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[9px] font-black text-purple-800 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-200 px-1.5 py-0.5 rounded shrink-0">
                          ✓ ACTIVE
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-snug">{off.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {off.subtitle || off.termsAndConditions || "Auto-applied at checkout"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveOfferIndex(idx);
                      if (off.redemptionType === "PRE_BOOK") {
                        setShowBookingModal(true);
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                    className={`h-8 px-3.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? "bg-purple-700 text-white shadow-xs hover:bg-purple-800"
                        : "bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    }`}
                  >
                    {isSelected
                      ? off.ctaText || (off.redemptionType === "PRE_BOOK" ? "Book & Pay" : "Pay Now")
                      : "Select"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 6. FLASH SALE DEALS SECTION (Rendered only if deals exist) */}
      {/* ========================================================= */}
      {data.flashSales?.deals && data.flashSales.deals.length > 0 && (
        <section className="px-4 pt-4 space-y-2.5" data-purpose="flash-sale-deals">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Flash Sale Deals</h2>
              <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                LIMITED
              </span>
            </div>
            <span
              onClick={() => toast.info(`Viewing all ${data.flashSales.deals.length} flash sale deals`)}
              className="text-xs font-bold text-purple-700 cursor-pointer"
            >
              View all ({data.flashSales.deals.length})
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {data.flashSales.deals.map((deal: any, idx: number) => (
              <div
                key={deal.id || idx}
                className="w-48 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="h-28 relative bg-slate-100">
                    <img
                      alt={deal.title}
                      className="w-full h-full object-cover"
                      src={deal.imageUrl || heroImage}
                      onClick={() => setSelectedImageZoom(deal.imageUrl || heroImage)}
                    />
                    {deal.discountBadge && (
                      <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                        {deal.discountBadge}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-slate-900 truncate">{deal.title}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-xs font-extrabold text-slate-900">₹{deal.dealPrice}</span>
                      {deal.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through">₹{deal.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-2.5 pb-2.5">
                  <button
                    onClick={() => handleClaimDeal(deal.title)}
                    className="w-full py-1.5 rounded-lg border border-purple-700 text-purple-700 hover:bg-purple-700 hover:text-white font-bold text-xs transition cursor-pointer"
                    type="button"
                  >
                    {deal.ctaText || "Claim Deal"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6B. STORE PRODUCTS & ESSENTIALS (Retail, Kirana, Supermarkets, Dairy) */}
      {/* ========================================================= */}
      {data.productsSection?.items && data.productsSection.items.length > 0 && (
        <section id="sec-products" className="px-4 pt-4 space-y-3" data-purpose="store-products">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs">
                <ShoppingBag size={13} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {data.productsSection.title || "Available Products"}
              </h2>
              <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {data.productsSection.items.length} In Store
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Retail Catalog
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.productsSection.items.map((prod) => (
              <div
                key={prod.id}
                onClick={() => {
                  setSelectedProductForDeal(prod);
                  setProductOrderQuantity(1);
                  setShowProductModal(true);
                }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={prod.imageUrl || heroImage}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {prod.discountBadge && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white font-extrabold text-[9.5px] px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                        {prod.discountBadge}
                      </span>
                    )}
                    {prod.inStock && (
                      <span className="absolute bottom-2 right-2 bg-emerald-950/80 backdrop-blur-xs text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>In Stock</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-extrabold text-purple-700 dark:text-purple-400">
                      {prod.brand || "Store Special"}
                    </p>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                      {prod.unit}
                    </p>
                  </div>
                </div>

                <div className="p-3 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-1">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ₹{Number(prod.sellingPrice).toLocaleString("en-IN")}
                      </span>
                      {prod.mrp && Number(prod.mrp) > Number(prod.sellingPrice) && (
                        <span className="text-[10.5px] line-through text-slate-400">
                          ₹{Number(prod.mrp).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductForDeal(prod);
                      setProductOrderQuantity(1);
                      setShowProductModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-extrabold shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 7. MENU HIGHLIGHTS SECTION (With Photo Mosaic Layout) */}
      {/* ========================================================= */}
      {((data.menuSection?.menuImages && data.menuSection.menuImages.length > 0) || (data.menuSection?.items && data.menuSection.items.some((d: any) => {
        const n = (d?.name || "").toLowerCase();
        return !n.includes("wood-fired truffle pizza") && !n.includes("smoked lamb rogan josh") && !n.includes("chargrilled peri-peri chicken") && !n.includes("wild mushroom risotto") && !n.includes("signature tiramisu");
      }))) && (
        <section id="sec-menu" className="px-4 pt-4 space-y-2.5" data-purpose="restaurant-menu">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Utensils size={13} />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Menu Highlights</h2>
            </div>
            {data.menuSection?.menuImages?.length > 0 && (
              <span
                onClick={() => setShowMenuModal(true)}
                className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
              >
                View all ({data.menuSection.menuImages.length})
              </span>
            )}
          </div>

          {/* Menu Photo Mosaic matching Photos & Ambiance style */}
          {data.menuSection?.menuImages && data.menuSection.menuImages.length > 0 && (
            <div>
              {data.menuSection.menuImages.length === 1 ? (
                <div
                  className="h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-xs"
                  onClick={() => setShowMenuModal(true)}
                >
                  <img
                    alt="Menu Page 1"
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    src={data.menuSection.menuImages[0]}
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                    <BookOpen size={11} /> Menu Page 1
                  </div>
                </div>
              ) : data.menuSection.menuImages.length === 2 ? (
                <div className="grid grid-cols-2 gap-2">
                  {data.menuSection.menuImages.slice(0, 2).map((img, idx) => (
                    <div
                      key={idx}
                      className="h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-xs"
                      onClick={() => setShowMenuModal(true)}
                    >
                      <img
                        alt={`Menu Page ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        src={img}
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <BookOpen size={11} /> Page {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-xs"
                    onClick={() => setShowMenuModal(true)}
                  >
                    <img
                      alt="Menu Page 1"
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      src={data.menuSection.menuImages[0]}
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <BookOpen size={11} /> Page 1
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-xs"
                      onClick={() => setShowMenuModal(true)}
                    >
                      <img
                        alt="Menu Page 2"
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                        src={data.menuSection.menuImages[1]}
                      />
                      <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Page 2
                      </div>
                    </div>
                    <div
                      className="h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group cursor-pointer shadow-xs"
                      onClick={() => setShowMenuModal(true)}
                    >
                      <img
                        alt="Menu Page 3"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        src={data.menuSection.menuImages[2]}
                      />
                      {data.menuSection.menuImages.length > 3 ? (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-white font-extrabold text-sm">
                          +{data.menuSection.menuImages.length - 2} Pages
                        </div>
                      ) : (
                        <div className="absolute top-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Page 3
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowMenuModal(true)}
                className="w-full mt-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                type="button"
              >
                <BookOpen size={13} className="text-purple-700" />
                <span>{data.menuSection.menuPagesText || `View full menu (${data.menuSection.menuImages.length} pages)`}</span>
              </button>
            </div>
          )}

          {/* Dish Specialties List if available: Filters out demo dummy pizza/lamb rogan josh */}
          {data.menuSection?.items && data.menuSection.items.length > 0 && (() => {
            const realItems = data.menuSection.items.filter((dish: any) => {
              const n = (dish?.name || "").toLowerCase();
              return !(
                n.includes("wood-fired truffle pizza") ||
                n.includes("smoked lamb rogan josh") ||
                n.includes("chargrilled peri-peri chicken") ||
                n.includes("wild mushroom risotto") ||
                n.includes("signature tiramisu")
              );
            });
            if (realItems.length === 0) return null;
            return (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 tracking-wider uppercase">
                    {data.menuSection.categoryTitle || "SPECIALTIES"}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">PRICE</span>
                </div>

                {realItems.map((dish: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {dish.isVeg ? (
                        <span className="w-3.5 h-3.5 rounded-xs border border-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-xs border border-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        </span>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{dish.name}</p>
                        {dish.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{dish.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">₹{dish.price}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      )}

      {/* ========================================================= */}
      {/* 8. PHOTOS MOSAIC SECTION (Rendered only if photos exist) */}
      {/* ========================================================= */}
      {data.heroPhotos && data.heroPhotos.length > 0 && (
        <section id="sec-photos" className="px-4 pt-4 space-y-2.5" data-purpose="restaurant-photos">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Photos & Ambiance</h2>
            <span
              onClick={() => setSelectedImageZoom(data.heroPhotos[0])}
              className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
            >
              View all ({data.totalPhotosCount})
            </span>
          </div>

          {data.heroPhotos.length === 1 ? (
            <div
              className="h-44 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs"
              onClick={() => setSelectedImageZoom(data.heroPhotos[0])}
            >
              <img
                alt="Store Ambiance"
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                src={data.heroPhotos[0]}
              />
            </div>
          ) : data.heroPhotos.length === 2 ? (
            <div className="grid grid-cols-2 gap-2">
              {data.heroPhotos.map((photo, idx) => (
                <div
                  key={idx}
                  className="h-36 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs"
                  onClick={() => setSelectedImageZoom(photo)}
                >
                  <img
                    alt={`Store Photo ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    src={photo}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div
                className="h-44 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs"
                onClick={() => setSelectedImageZoom(data.photoMosaic?.primaryPhoto || data.heroPhotos[0])}
              >
                <img
                  alt="Primary Store View"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  src={data.photoMosaic?.primaryPhoto || data.heroPhotos[0]}
                />
              </div>
              <div className="space-y-2">
                <div
                  className="h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs"
                  onClick={() => setSelectedImageZoom(data.photoMosaic?.secondaryPhotos?.[0] || data.heroPhotos[1])}
                >
                  <img
                    alt="Store View 2"
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    src={data.photoMosaic?.secondaryPhotos?.[0] || data.heroPhotos[1]}
                  />
                </div>
                <div
                  className="h-20 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer shadow-xs"
                  onClick={() => setSelectedImageZoom(data.photoMosaic?.secondaryPhotos?.[1] || data.heroPhotos[2])}
                >
                  <img
                    alt="Store View 3"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    src={data.photoMosaic?.secondaryPhotos?.[1] || data.heroPhotos[2]}
                  />
                  {data.photoMosaic?.additionalCountText && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-white font-extrabold text-sm">
                      {data.photoMosaic.additionalCountText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 9. VERIFIED AMENITIES SECTION (From Database) */}
      {/* ========================================================= */}
      {data.amenities && data.amenities.length > 0 && (
        <section id="sec-amenities" className="px-4 pt-4 space-y-2.5" data-purpose="amenities">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Verified Amenities</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
              {data.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs shrink-0">
                    {renderAmenityIcon(amenity.icon)}
                  </span>
                  <span className="truncate">{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 10. LOCATION & MAP SECTION */}
      {/* ========================================================= */}
      <section id="sec-location" className="px-4 pt-4 space-y-2.5" data-purpose="location">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Location</h2>
          {data.locationSection?.distanceText && (
            <span onClick={handleDirections} className="text-xs font-bold text-purple-700 cursor-pointer">
              {data.locationSection.distanceText}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="relative h-32 w-full bg-slate-100 cursor-pointer" onClick={handleDirections}>
            <img
              alt="Map Location Preview"
              className="w-full h-full object-cover"
              src={data.locationSection?.mapPreviewImageUrl || "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80"}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin size={16} />
              </div>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 leading-snug truncate">
                {data.locationSection?.addressLine1 || data.address}
              </p>
              {data.locationSection?.addressLine2 && (
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {data.locationSection.addressLine2}
                </p>
              )}
            </div>
            <button
              onClick={handleDirections}
              aria-label="Open in Google Maps"
              className="px-3 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-purple-800 active:scale-95 transition cursor-pointer"
              type="button"
            >
              <ExternalLink size={12} />
              <span>Navigate</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. CONCIERGE HELP & SUPPORT */}
      {/* ========================================================= */}
      {data.phone && (
        <section className="px-4 pt-4" data-purpose="help-support">
          <div
            onClick={handleCall}
            className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Headphones size={15} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {data.concierge?.title || "Have queries or need help booking?"}
                </p>
                <p className="text-[11px] text-purple-700 font-medium mt-0.5 hover:underline">
                  {data.concierge?.subtitle || `${data.storeName} Concierge Support`} ({data.phone})
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 12. SIMILAR PLACES NEAR YOU (Rendered only if exist) */}
      {/* ========================================================= */}
      {data.similarPlaces && data.similarPlaces.length > 0 && (
        <section id="sec-similar" className="px-4 pt-4 pb-4 space-y-3" data-purpose="recommended-options">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Similar Places Near You</h2>
            <ChevronRight size={14} className="text-purple-700 cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {data.similarPlaces.map((spot: any) => (
              <div
                key={spot.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs cursor-pointer group"
                onClick={() => toast.info(`Viewing ${spot.name}`)}
              >
                <div className="h-28 relative bg-slate-100">
                  <img
                    alt={spot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    src={spot.imageUrl || heroImage}
                  />
                  <div className="absolute bottom-2 right-2 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                    <span>{spot.rating}</span>
                    <Star size={8} className="fill-white text-white" />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-slate-900 truncate">{spot.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{spot.distanceLocalityCuisine}</p>
                  {spot.offerBadge && (
                    <div className="mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                      {spot.offerBadge}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 13. PERSISTENT BOTTOM ACTION BAR */}
      {/* ========================================================= */}
      <footer className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-3xl border-t border-slate-200/90 dark:border-slate-800 shadow-2xl p-3.5">
        {/* Floating Incentive Teaser Pill */}
        <div className="mb-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 font-black text-[9px] flex items-center justify-center border border-amber-400">
              2X
            </span>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              {data.bottomBar?.rewardTeaser?.text || "Earn 5% PINAK Coins on bill payment"}
            </span>
          </div>
          <Info size={14} className="text-emerald-600 dark:text-emerald-400 cursor-pointer shrink-0" />
        </div>

        {/* High-Impact Dual CTAs Matching Pinak Palette */}
        <div className="flex items-center gap-2.5">
          {data.bottomBar?.isTableBookingEnabled && (
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex-1 py-3 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold active:scale-98 transition text-sm text-center cursor-pointer shadow-xs"
              type="button"
            >
              Book a table
            </button>
          )}
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 py-3 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold active:scale-98 transition text-sm shadow-md shadow-purple-600/20 text-center cursor-pointer"
            type="button"
          >
            Pay bill now
          </button>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* PRODUCTION-READY INTERACTIVE TABLE RESERVATION MODAL */}
      {/* ========================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Reserve a Table
                  </h3>
                  <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Instant Confirm
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {data.storeName} • {data.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Date Selection */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Select Date
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Today", "Tomorrow", "Day After"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`py-2 rounded-xl border text-center font-bold cursor-pointer transition ${
                        selectedDate === d
                          ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guests Count Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Number of Guests
                  </label>
                  <span className="text-slate-500 text-[11px]">
                    Limit: {minParty} to {maxParty} Guests
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2">
                  <button
                    type="button"
                    disabled={selectedGuests <= minParty}
                    onClick={() => setSelectedGuests((g) => Math.max(minParty, g - 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users size={15} className="text-purple-600" />
                    <span>{selectedGuests} Guests</span>
                  </span>
                  <button
                    type="button"
                    disabled={selectedGuests >= maxParty}
                    onClick={() => setSelectedGuests((g) => Math.min(maxParty, g + 1))}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Time Slots Selector (Loaded from DB) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Available Time Slots
                  </label>
                  <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                    <Clock size={11} /> {primaryOffer?.gracePeriodMinutes || 15}m Grace Period
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {parsedSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 rounded-xl border text-center font-bold transition cursor-pointer text-xs ${
                        selectedSlot === slot
                          ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Perks & Cover Charge */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                  <span>Cover Charge:</span>
                  <span>{primaryOffer?.coverChargeAmount && Number(primaryOffer.coverChargeAmount) > 0 ? `₹${primaryOffer.coverChargeAmount}` : "₹0 (Free Booking)"}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                  <span>Reward Perks:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Coins size={11} /> +{bonusCoins} PINAK Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(false);
                  toast.success(`Table Booked for ${selectedGuests} Guests!`, {
                    description: `Confirmed at ${data.storeName} for ${selectedDate} at ${selectedSlot}. +${bonusCoins} Coins queued!`
                  });
                }}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} />
                <span>Confirm Reservation ({selectedDate} @ {selectedSlot})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRODUCTION-READY INTERACTIVE PINAK PAY BILL MODAL */}
      {/* ========================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Wallet size={17} className="text-purple-600" />
                  <span>PINAK Pay — Instant Bill Pass</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paying at {data.storeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Bill Input */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Enter Your Total Food & Beverage Bill (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={enteredBillAmount || ""}
                    onChange={(e) => setEnteredBillAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 1000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              {/* Applied Offer Banner */}
              {primaryOffer && (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-200 text-xs flex items-center gap-1">
                      <Sparkles size={12} className="text-purple-600" />
                      <span>{primaryOffer.title}</span>
                    </span>
                    <span className="bg-purple-700 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      APPLIED
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                    {discountPct}% discount capped up to ₹{maxDiscountCap}
                  </p>
                </div>
              )}

              {/* Bill Breakdown Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
                  <span>Subtotal Bill:</span>
                  <span>₹{enteredBillAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Instant PINAK Discount ({discountPct}%):</span>
                  <span>-₹{calculatedDiscount.toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Final Payable:</span>
                  <span>₹{finalPayable.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Reward Bonus Coins Box */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center">
                    🪙
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">+{bonusCoins} Reward Coins</p>
                    <p className="text-[10px] text-slate-500">Credited to wallet upon payment</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase">
                  Instant
                </span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "UPI", label: "Google Pay / PhonePe (UPI)", icon: <QrCode size={13} /> },
                    { id: "CARDS", label: "Credit / Debit Card", icon: <CreditCard size={13} /> }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition cursor-pointer text-xs ${
                        selectedPaymentMethod === m.id
                          ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {m.icon}
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => {
                  setShowPaymentModal(false);
                  toast.success(`Payment of ₹${finalPayable} Successful!`, {
                    description: `You saved ₹${calculatedDiscount} and earned +${bonusCoins} PINAK Coins at ${data.storeName}!`
                  });
                }}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <Bolt size={15} />
                <span>Pay ₹{finalPayable.toLocaleString("en-IN")} via {selectedPaymentMethod}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RETAIL / KIRANA PRODUCT DEAL & EXPRESS CHECKOUT MODAL */}
      {/* ========================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShoppingBag size={17} className="text-emerald-600" />
                  <span>Retail Store Product Deal</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Available at {data.storeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const activeProduct = selectedProductForDeal || targetOffer;
              const prodTitle = activeProduct?.title || activeProduct?.name || "Product Deal";
              const prodImage = activeProduct?.imageUrl;
              const prodMrp = activeProduct?.originalMrp || activeProduct?.mrp;
              const prodPrice = activeProduct?.dealPrice || activeProduct?.sellingPrice || activeProduct?.discountValue || 58;
              const prodBadge = activeProduct?.discountBadge || activeProduct?.badges?.[0] || "Special Deal";

              return (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                    {/* Product Card Info */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                      {prodImage ? (
                        <img
                          src={prodImage}
                          alt={prodTitle}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {prodTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {prodMrp && Number(prodMrp) > Number(prodPrice) && (
                            <span className="text-xs line-through text-slate-400">
                              ₹{Number(prodMrp).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-sm font-black text-pink-600">
                            ₹{Number(prodPrice).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            {prodBadge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Select Quantity</p>
                        <p className="text-[10px] text-slate-500">Subject to store stock availability</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setProductOrderQuantity((prev) => Math.max(1, prev - 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer active:scale-95"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-black text-sm text-slate-900 dark:text-white">
                          {productOrderQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setProductOrderQuantity((prev) => Math.min(10, prev + 1))}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 cursor-pointer active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Price Calculation */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Price ({productOrderQuantity} item{productOrderQuantity > 1 ? "s" : ""}):</span>
                        <span>₹{((Number(prodPrice)) * productOrderQuantity).toLocaleString("en-IN")}</span>
                      </div>
                      {prodMrp && Number(prodMrp) > Number(prodPrice) && (
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                          <span>You Save:</span>
                          <span>-₹{((Number(prodMrp) - Number(prodPrice)) * productOrderQuantity).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                        <span>Payable at Store Counter:</span>
                        <span>₹{((Number(prodPrice)) * productOrderQuantity).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Store Pickup Notice */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 flex items-center gap-2">
                      <Store size={15} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-snug">
                        Show voucher token at store express counter for instant item collection.
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductModal(false);
                        const total = (Number(prodPrice)) * productOrderQuantity;
                        toast.success(`Deal Voucher Claimed for ${productOrderQuantity}x "${prodTitle}"!`, {
                          description: `Total ₹${total} payable at ${data.storeName} billing counter.`
                        });
                        setSelectedProductForDeal(null);
                      }}
                      className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={15} />
                      <span>Claim Deal Voucher (₹{((Number(prodPrice)) * productOrderQuantity).toLocaleString("en-IN")})</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL MENU SCANS LIGHTBOX MODAL */}
      {/* ========================================================= */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {data.storeName} — Menu Cards
                </h3>
                <p className="text-xs text-slate-500">
                  {data.menuSection?.menuImages?.length || 0} scanned pages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(data.menuSection?.menuImages || []).map((imgUrl: string, idx: number) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Menu Page {idx + 1}
                  </div>
                  <img alt={`Menu Page ${idx + 1}`} src={imgUrl} className="w-full object-contain max-h-[420px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SINGLE IMAGE ZOOM MODAL */}
      {selectedImageZoom && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImageZoom(null)}
        >
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImageZoom(null)}
              className="absolute -top-10 right-0 text-white p-1 hover:text-slate-300 cursor-pointer"
            >
              <X size={24} />
            </button>
            <img alt="Enlarged view" src={selectedImageZoom} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailPreviewView;
