import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  MapPin,
  Sparkles,
  CheckCircle2,
  Heart,
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
  Store,
  Tag
} from "lucide-react";
import { Link } from "wouter";
import apiClient from "@/api/client";
import { toast } from "sonner";

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
 * If 1 store has 3 offers, only 1 card is displayed with the best discount / latest deal.
 */
function deduplicateOffersByStore(rawOffers: NearbyOffer[]): NearbyOffer[] {
  const storeMap = new Map<string, NearbyOffer>();

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

  return Array.from(storeMap.values());
}

export default function CustomerHomePreviewPage() {
  const [offers, setOffers] = useState<NearbyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [seconds, setSeconds] = useState(10);
  const [userLocation, setUserLocation] = useState({
    name: "100ft Rd, Indiranagar",
    city: "Bengaluru, Karnataka",
    latitude: 21.1458,
    longitude: 79.0882,
    radiusKm: 15.0
  });

  const fetchNearbyOffers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/offers/nearby", {
        params: {
          type: "SERVICE",
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: userLocation.radiusKm,
          limit: 10
        }
      });
      const data = res.data?.data;
      const list = Array.isArray(data?.offers) ? data.offers : Array.isArray(data) ? data : [];
      setOffers(list);
    } catch (err: any) {
      console.warn("Could not fetch live offers, falling back to catalog preview:", err?.message);
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

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success(favorites[id] ? "Removed from favorites" : "Saved to your favorites!");
  };

  const handleClaimOffer = (title: string, storeName?: string) => {
    toast.success(`Selected deal: "${title}"`, {
      description: `Opening booking & redemption pass for ${storeName || "Partner Branch"}`
    });
  };

  // Fallback demo cards when backend table has no service offers yet
  const fallbackDemoOffers: NearbyOffer[] = [
    {
      offerId: "demo-1",
      id: "demo-1",
      title: "The Smokehouse Grill",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChrnSq1Yaf94yJfSJ5ur4cBX9zPgxfzaFFDsPdDhCidTKabd60P9K39f623JQ_oGlV5eiPB1fOJvpvCiApK6ms2dmLCzM0kWM-hM4syELjd460EHe4HKYxTHeKU9v_s5udHMvZbhsO7YeyXiZtWd7ZysQwu1cyKdgW-chLu0Pxq8BfiMm3e_rwX5FwNfcWIBNP6BnAwIYjFnu4UaiC3oo6P3pAkkIos5JeSEHTqIWbGSCOVYLS2_6A",
      offerType: "PERCENTAGE_DISCOUNT",
      type: "PERCENTAGE_DISCOUNT",
      discountValue: 40,
      value: 40,
      maxDiscountAmount: 500,
      minimumOrderAmount: 1000,
      minTransactionAmount: 1000,
      ctaText: "Book & Pay",
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45m left
      merchant: { name: "The Smokehouse Grill", isVerified: true },
      merchantSummary: { name: "The Smokehouse Grill", isVerified: true },
      branch: { name: "Indiranagar", distanceMeters: 400 },
      branchSummary: { storeName: "Indiranagar", distanceMeters: 400 },
      reward: { coins: 150, label: "+150 Coins" },
      rewardSummary: { coins: 150, text: "+150 Coins" }
    },
    {
      offerId: "demo-2",
      id: "demo-2",
      title: "Toni & Guy Salon",
      subtitle: "On all hair styling, cuts & blowouts",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAehSDVlzhdQ16LCD3SUe6-wxhHUsmZUUY-JmmKUaqH4ghRz4GRc5y8SKK-KUlwsumUiEhYY5_oBm0qvi0z_25GMG_Ia1eCvVn_8hAAo0SfaqVIM6ylnv46yGbRKidvcQpsUTRzx76zmddVa4cgq7k5M1oOaDI5Inq7GIUwpYx8Qa6Fm6b6MiRi7svrYl3zVvUkBWfwCJdaynuQOq__J_hcLaWDaNmNdxHAtrpv9uoxzGBOCof7iUZB",
      offerType: "BUY_X_GET_Y",
      type: "BUY_X_GET_Y",
      discountValue: 100,
      value: 100,
      ctaText: "Claim Offer",
      expiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString(), // 3h left
      merchant: { name: "Toni & Guy Salon", isVerified: true },
      merchantSummary: { name: "Toni & Guy Salon", isVerified: true },
      branch: { name: "12th Main", distanceMeters: 650 },
      branchSummary: { storeName: "12th Main", distanceMeters: 650 },
      reward: { coins: 100, label: "+100 Coins" },
      rewardSummary: { coins: 100, text: "+100 Coins" }
    },
    {
      offerId: "demo-3",
      id: "demo-3",
      title: "Third Wave Coffee",
      subtitle: "+ 2X Coins on PINAK UPI scan",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuClpqS39UuLowTW3Hh-y9Tt5My-4zYZMJ3FYAg9S_V091zs2kZoz4YfYCFBZ9zbIQZj7MtacljzmCmkYPAXX3cD013fNOHUyVBehRTd5kHMDg0jUfPa3Ciy54ForaHAL0MxrnJDA1ItPq9sqMAwgYdDNxdlh0CFmQZAokEFziCj4MY3PRcK2wiwapuMQqFn9w9UUmQ5Pj5aJasCGB1Hy4UTNbEE0X9LhaIc6dZhoIMxkAgXIR6B_wtU",
      offerType: "FIXED_DISCOUNT",
      type: "FIXED_DISCOUNT",
      discountValue: 150,
      value: 150,
      maxDiscountAmount: 200,
      minimumOrderAmount: 500,
      ctaText: "Claim Offer",
      expiresAt: new Date(Date.now() + 4 * 86400 * 1000).toISOString(), // Till <Day>
      merchant: { name: "Third Wave Coffee", isVerified: true },
      merchantSummary: { name: "Third Wave Coffee", isVerified: true },
      branch: { name: "Main Branch", distanceMeters: 300 },
      branchSummary: { storeName: "Main Branch", distanceMeters: 300 },
      reward: { coins: 200, label: "+200 Coins" },
      rewardSummary: { coins: 200, text: "+200 Coins" }
    }
  ];

  const rawOffers = offers.length > 0 ? offers : fallbackDemoOffers;
  const displayedServiceOffers = deduplicateOffersByStore(rawOffers);

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

        <div className="flex items-center gap-3">
          {/* Location status */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
            <MapPin size={13} className="text-purple-400" />
            <span className="text-[11px]">
              Nagpur Hub ({userLocation.latitude}, {userLocation.longitude})
            </span>
          </div>

          <button
            onClick={() => {
              fetchNearbyOffers();
              toast.info("Refreshed nearby service offers from database");
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors cursor-pointer shadow-sm"
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Syncing..." : "Refresh Live Deals"}</span>
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="py-6 sm:py-10 px-2 sm:px-4 flex justify-center w-full">
        {/* iOS Mobile Phone Mockup Frame */}
        <div className="w-full max-w-[430px] bg-[#fbfbff] min-h-[900px] text-slate-800 relative pb-28 shadow-2xl rounded-[36px] overflow-hidden border-[6px] border-slate-800 ring-1 ring-slate-700">
          
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
              <button
                type="button"
                onClick={() => toast.info("Location locked to partner region for deal discovery")}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 transition-colors max-w-[170px] rounded-lg text-left"
              >
                <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{userLocation.name}</p>
                  <p className="text-[9px] text-slate-500 truncate leading-none">{userLocation.city}</p>
                </div>
              </button>

              {/* Right Utilities */}
              <div className="flex items-center space-x-2 shrink-0">
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
            <div className="flex space-x-3.5 overflow-x-auto no-scrollbar px-4 py-1">
              {displayedServiceOffers.map((o) => {
                const offerKey = o.offerId || o.id || Math.random().toString();
                const storeName = o.branch?.name || o.branchSummary?.storeName || o.merchant?.name || o.merchantSummary?.name || "Main Branch";
                const merchantName = o.merchant?.name || o.merchantSummary?.name || o.title;
                const distanceMeters = o.branch?.distanceMeters ?? o.branchSummary?.distanceMeters;
                const distanceText = distanceMeters != null
                  ? (distanceMeters < 1000
                    ? `${distanceMeters}m`
                    : `${(distanceMeters / 1000).toFixed(1)} km`)
                  : "Nearby";

                const discountVal = Number(o.discountValue ?? o.value ?? 0);
                const rawType = (o.offerType || o.type || "").toUpperCase();

                let discountText = "";
                if (rawType.includes("PERCENT") || rawType === "FLAT_PCT") {
                  discountText = discountVal > 0 ? `${discountVal}% OFF` : (o.title?.includes("%") ? o.title : "SPECIAL DISCOUNT");
                } else if (rawType.includes("BOGO") || rawType.includes("BUY_X_GET_Y")) {
                  discountText = "BUY 1 GET 1 FREE";
                } else if (rawType.includes("CASHBACK")) {
                  discountText = discountVal > 0 ? `₹${discountVal} CASHBACK` : "CASHBACK DEAL";
                } else {
                  // Fixed / Flat Discount
                  discountText = discountVal > 0 ? `FLAT ₹${discountVal} OFF` : (o.title || "SPECIAL DEAL");
                }

                const cap = Number(o.maxDiscountAmount ?? 0);
                const minBill = Number(o.minimumOrderAmount ?? o.minTransactionAmount ?? 0);
                
                let conditionText = "";
                if (cap > 0 && minBill > 0) {
                  conditionText = `Up to ₹${cap.toLocaleString("en-IN")} • On bills above ₹${minBill.toLocaleString("en-IN")}`;
                } else if (cap > 0) {
                  conditionText = `Up to ₹${cap.toLocaleString("en-IN")} • No min bill required`;
                } else if (minBill > 0) {
                  conditionText = `On bills above ₹${minBill.toLocaleString("en-IN")}`;
                } else if (o.subtitle) {
                  conditionText = o.subtitle;
                } else {
                  conditionText = "No min bill required";
                }

                const expiry = o.expiresAt || o.validTo;
                const badge = formatTimeLeftBadge(expiry);
                const rewardCoins = o.reward?.coins || o.rewardSummary?.coins || o.bonusCoins || 150;
                const imageSrc = o.imageUrl || o.imgUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

                return (
                  <article
                    key={offerKey}
                    className="w-64 shrink-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Card Thumbnail */}
                      <div className="relative h-28 w-full bg-slate-100">
                        <img
                          alt={merchantName}
                          className="w-full h-full object-cover"
                          src={imageSrc}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";
                          }}
                        />
                        {/* Dynamic Time-Left Badge */}
                        <span className={`absolute top-2 left-2 ${badge.bg} backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs tracking-tight`}>
                          <Clock size={10} className="stroke-[2.5]" />
                          <span>{badge.text}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(offerKey, e)}
                          aria-label="Favorite"
                          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                        >
                          <Heart
                            size={14}
                            className={favorites[offerKey] ? "fill-rose-500 text-rose-500" : "text-white"}
                          />
                        </button>
                      </div>

                      {/* Card Body */}
                      <div className="p-3">
                        <div className="flex items-center space-x-1 mb-0.5">
                          <h3 className="text-xs font-bold text-slate-900 truncate" title={merchantName}>
                            {merchantName}
                          </h3>
                          <CheckCircle2 size={13} className="text-blue-500 shrink-0 fill-blue-500 text-white" />
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2 truncate">
                          {storeName} • {distanceText}
                        </p>

                        {/* Deal Highlight Box */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 mb-2.5">
                          <p className="text-[11px] font-black text-emerald-700 leading-tight">
                            {discountText}
                          </p>
                          <p className="text-[9px] text-emerald-800 font-medium truncate">
                            {conditionText}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-3 pb-3 flex items-center justify-between border-t border-slate-50 pt-2">
                      <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                        🪙 +{rewardCoins} Coins
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClaimOffer(o.title, storeName)}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        {o.ctaText || "Book & Pay"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Flash Deals Ending Soon Block */}
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

                <span className="bg-white text-purple-950 text-[10px] font-extrabold px-3 py-1.5 flex items-center space-x-1 rounded-lg">
                  View All Deals
                </span>
              </div>
            </div>
          </section>

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

          {/* Bottom Fixed Navigation Bar */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 z-50 flex items-center justify-around shadow-lg">
            <button type="button" className="flex flex-col items-center text-purple-700 space-y-0.5 min-w-[54px]">
              <Compass size={20} />
              <span className="text-[9px] font-bold">Discover</span>
            </button>
            <button type="button" className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px]">
              <Tag size={20} />
              <span className="text-[9px] font-medium">Deals</span>
            </button>
            {/* Scan & Pay Center Button */}
            <div className="relative -top-5 flex flex-col items-center">
              <button
                type="button"
                onClick={() => toast.info("Opening In-Store UPI QR Scanner")}
                className="w-13 h-13 p-3 bg-purple-700 hover:bg-purple-800 text-white shadow-lg flex items-center justify-center rounded-xl transition-transform active:scale-95"
              >
                <QrCode size={24} />
              </button>
              <span className="text-[9px] font-bold text-purple-950 mt-1">Scan & Pay</span>
            </div>
            <button type="button" className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px]">
              <TicketPercent size={20} />
              <span className="text-[9px] font-medium">Orders</span>
            </button>
            <button type="button" className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px]">
              <User size={20} />
              <span className="text-[9px] font-medium">Pocket</span>
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}
