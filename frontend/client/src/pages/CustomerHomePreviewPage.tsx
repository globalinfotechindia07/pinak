import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
  Share2,
  X,
  Percent,
  Wallet,
  Coins,
  Award,
  LogIn,
  LogOut,
  Key,
  Smartphone,
  Check
} from "lucide-react";
import { Link } from "wouter";
import apiClient from "@/api/client";
import { rewardApi, CustomerRewardAccountDTO } from "@/api/rewardApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ServiceDetailPreviewView } from "@/components/ServiceDetailPreviewView";
import { CustomerOrdersView } from "@/components/CustomerOrdersView";
import { TableBookingView } from "@/components/TableBookingView";
import tableBookingApi, { TableBookingDetails } from "@/api/tableBookingApi";
import { useAppStore } from "@/hooks/useAppStore";
import { authApi } from "@/api/authApi";
import { bannerApi } from "@/api/bannerApi";
import { HomeBanner } from "@/types";
import { categoryApi } from "@/api/categoryApi";
import { CategoryDTO } from "@/types/api/category.dto";

interface NearbyOffer {
  id?: string;
  offerId?: string;
  categoryId?: string;
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

const getCategoryVisual = (catName: string, iconToken?: string) => {
  const name = (catName || "").toLowerCase();
  const token = (iconToken || "").toLowerCase();

  if (name === "all") {
    return { icon: "🔥", bg: "bg-purple-700 text-white", activeBg: "bg-purple-700 text-white ring-2 ring-purple-600 shadow-sm" };
  }
  if (token.includes("utensil") || name.includes("dining") || name.includes("food") || name.includes("restaurant")) {
    return { icon: "🍔", bg: "bg-orange-100 text-orange-600", activeBg: "bg-orange-600 text-white ring-2 ring-orange-500 shadow-sm" };
  }
  if (token.includes("coffee") || name.includes("cafe") || name.includes("bakery") || name.includes("brew")) {
    return { icon: "☕", bg: "bg-amber-100 text-amber-700", activeBg: "bg-amber-600 text-white ring-2 ring-amber-500 shadow-sm" };
  }
  if (token.includes("cart") || name.includes("supermarket") || name.includes("grocery") || name.includes("fmcg")) {
    return { icon: "🛒", bg: "bg-emerald-100 text-emerald-700", activeBg: "bg-emerald-600 text-white ring-2 ring-emerald-500 shadow-sm" };
  }
  if (token.includes("store") || name.includes("kirana") || name.includes("daily") || name.includes("mart")) {
    return { icon: "🏪", bg: "bg-rose-100 text-rose-600", activeBg: "bg-rose-600 text-white ring-2 ring-rose-500 shadow-sm" };
  }
  if (token.includes("shirt") || name.includes("fashion") || name.includes("apparel") || name.includes("cloth")) {
    return { icon: "👕", bg: "bg-indigo-100 text-indigo-600", activeBg: "bg-indigo-600 text-white ring-2 ring-indigo-500 shadow-sm" };
  }
  if (token.includes("laptop") || name.includes("electronic") || name.includes("gadget") || name.includes("phone")) {
    return { icon: "💻", bg: "bg-sky-100 text-sky-600", activeBg: "bg-sky-600 text-white ring-2 ring-sky-500 shadow-sm" };
  }
  if (token.includes("wrench") || name.includes("hardware") || name.includes("tool") || name.includes("sanitary")) {
    return { icon: "🔧", bg: "bg-violet-100 text-violet-600", activeBg: "bg-violet-600 text-white ring-2 ring-violet-500 shadow-sm" };
  }
  if (token.includes("scissor") || name.includes("salon") || name.includes("beauty") || name.includes("spa")) {
    return { icon: "✂️", bg: "bg-pink-100 text-pink-600", activeBg: "bg-pink-600 text-white ring-2 ring-pink-500 shadow-sm" };
  }
  if (token.includes("dumbbell") || name.includes("gym") || name.includes("fitness") || name.includes("sport")) {
    return { icon: "🏋️", bg: "bg-teal-100 text-teal-600", activeBg: "bg-teal-600 text-white ring-2 ring-teal-500 shadow-sm" };
  }
  if (token.includes("car") || name.includes("automotive") || name.includes("bike") || name.includes("motor")) {
    return { icon: "🚗", bg: "bg-blue-100 text-blue-600", activeBg: "bg-blue-600 text-white ring-2 ring-blue-500 shadow-sm" };
  }
  return { icon: "🏷️", bg: "bg-slate-100 text-slate-700", activeBg: "bg-purple-600 text-white ring-2 ring-purple-500 shadow-sm" };
};

const FALLBACK_CATEGORIES: Array<{ id: string; name: string; icon: string }> = [
  { id: "11111111-1111-1111-1111-111111111101", name: "Dining", icon: "utensils" },
  { id: "11111111-1111-1111-1111-111111111102", name: "Cafes", icon: "coffee" },
  { id: "11111111-1111-1111-1111-111111111103", name: "Supermarket", icon: "shopping-cart" },
  { id: "11111111-1111-1111-1111-111111111104", name: "Kirana", icon: "store" },
  { id: "11111111-1111-1111-1111-111111111105", name: "Fashion", icon: "shirt" },
  { id: "11111111-1111-1111-1111-111111111106", name: "Electronics", icon: "laptop" },
  { id: "11111111-1111-1111-1111-111111111107", name: "Hardware", icon: "wrench" },
  { id: "11111111-1111-1111-1111-111111111108", name: "Salons", icon: "scissors" },
  { id: "11111111-1111-1111-1111-111111111109", name: "Gyms", icon: "dumbbell" },
  { id: "11111111-1111-1111-1111-111111111110", name: "Automotive", icon: "car" },
];

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

function getCustomerInitials(name?: string): string {
  if (!name) return "GU";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CustomerHomePreviewPage() {
  const appStore = useAppStore();

  // Real Customer Account & Wallet Balance from PostgreSQL Database (Zero Dummy Data)
  const [activeCustomer, setActiveCustomer] = useState<CustomerRewardAccountDTO | null>(null);
  const [rewardAccounts, setRewardAccounts] = useState<CustomerRewardAccountDTO[]>([]);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"wallet" | "otp" | "token" | "accounts">("wallet");

  // Mobile OTP Login state
  const [loginPhone, setLoginPhone] = useState<string>("");
  const [loginOtp, setLoginOtp] = useState<string>("");
  const [otpSessionId, setOtpSessionId] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpTestCode, setOtpTestCode] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);

  // Postman Token Login state
  const [postmanToken, setPostmanToken] = useState<string>("");
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [accountSearchFilter, setAccountSearchFilter] = useState<string>("");

  const loadDatabaseAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const accounts = await rewardApi.getAllAccounts();
      // Exclude platform admin accounts from mobile customer directory
      const customerOnly = (accounts || []).filter(
        (a) => !a.customerEmail?.includes("admin") && a.customerId !== "d0000000-0000-0000-0000-000000000001"
      );
      setRewardAccounts(customerOnly);
      return customerOnly;
    } catch (err) {
      console.warn("Could not load real customer reward accounts from backend:", err);
      setRewardAccounts([]);
      return [];
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Real Hero Promotional Banners from PostgreSQL Database
  const [heroBanners, setHeroBanners] = useState<HomeBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);
  const [isLoadingBanners, setIsLoadingBanners] = useState<boolean>(true);
  const [isBannerHovered, setIsBannerHovered] = useState<boolean>(false);

  const fetchHeroBanners = async () => {
    setIsLoadingBanners(true);
    try {
      const data = await bannerApi.getActiveBanners("DISCOVER");
      if (data && data.length > 0) {
        setHeroBanners(data);
      }
    } catch (err) {
      console.warn("Could not load real hero banners from backend:", err);
    } finally {
      setIsLoadingBanners(false);
    }
  };

  useEffect(() => {
    fetchHeroBanners();
  }, []);

  // Auto-advance banner carousel every 4.5 seconds
  useEffect(() => {
    if (heroBanners.length <= 1 || isBannerHovered) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroBanners.length, isBannerHovered]);

  const getBannerGradient = (style?: string) => {
    switch (style) {
      case "SECONDARY_GRADIENT":
        return "from-slate-950/95 via-indigo-950/90 to-blue-900/85";
      case "TERTIARY_GRADIENT":
        return "from-slate-950/95 via-emerald-950/90 to-teal-900/85";
      case "SUNSET_AMBER":
        return "from-amber-950/95 via-orange-900/90 to-rose-900/85";
      case "PRIMARY_GRADIENT":
      default:
        return "from-purple-950/95 via-purple-900/90 to-indigo-900/85";
    }
  };

  const getRemainingTimeText = (endTime?: string) => {
    if (!endTime) return null;
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    return `${hours}h ${mins}m left`;
  };

  const handleBannerClick = (b: HomeBanner) => {
    const action = (b.ctaAction || "").toUpperCase();
    const target = b.ctaTargetId || "";

    if (action === "TABLE_RESERVATION" || target.includes("tbl") || b.title.toLowerCase().includes("dining")) {
      toast.success(`Opening Table Booking: ${b.title}`, {
        description: "Browse verified dine-in slots with flat 50% discount"
      });
      const el = document.getElementById("offers-feed-section") || document.getElementById("stores-rail");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (action === "PRODUCT_DEAL" || target.includes("deal")) {
      toast.success(`Opening Deals: ${b.title}`, {
        description: b.subtitle || "Check out exclusive product bargains near you"
      });
      const el = document.getElementById("product-deals-section") || document.getElementById("offers-feed-section");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (action === "CLAIM_PASS" || target.includes("pass")) {
      toast.success(`Reward Pass Claimed: ${b.badgeText}`, {
        description: `Pass for "${b.title}" activated on your PINAK account!`
      });
      return;
    }

    toast.success(`Selected Offer: ${b.title}`, {
      description: b.subtitle || "Enjoy exclusive PINAK discounts"
    });
  };

  // Load real customer session & database accounts on mount
  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("pinak_mobile_token") : null;
    const savedCustomerId = typeof window !== "undefined" ? localStorage.getItem("pinak_active_customer_id") : null;

    loadDatabaseAccounts().then((accounts) => {
      // 1. Try to restore saved customer by ID if exists in database
      if (savedCustomerId && accounts && accounts.length > 0) {
        const found = accounts.find((a) => a.customerId === savedCustomerId || a.id === savedCustomerId);
        if (found) {
          setActiveCustomer(found);
          return;
        }
      }

      // 2. Or if a saved mobile token exists, validate via /auth/me
      if (savedToken) {
        authApi.validateMobileToken(savedToken).then(async (user) => {
          if (user) {
            let balance: any = null;
            try {
              balance = await rewardApi.getRewardBalance();
            } catch {}
            const matchedAccount = accounts.find((a) => a.customerId === user.id || a.customerPhone === user.phone);
            if (matchedAccount) {
              setActiveCustomer(matchedAccount);
            } else {
              setActiveCustomer({
                id: user.id,
                customerId: user.id,
                customerName: user.name || "Mobile User",
                customerPhone: user.phone || user.mobile || "",
                customerEmail: user.email || "",
                availableBalance: balance?.availableBalance ?? balance?.pointsBalance ?? 0,
                pendingBalance: balance?.pendingBalance ?? 0,
                lifetimeEarned: balance?.lifetimeEarned ?? 0,
                lifetimeRedeemed: balance?.lifetimeRedeemed ?? 0,
                currency: "INR",
                tier: balance?.tier || "SILVER",
                status: user.status || "ACTIVE",
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          }
        }).catch(() => {
          localStorage.removeItem("pinak_mobile_token");
        });
      }
    });
  }, []);

  const refreshActiveCustomerBalance = async (customerId?: string) => {
    const idToFetch = customerId || activeCustomer?.customerId;
    if (!idToFetch) return;
    try {
      const fresh = await rewardApi.getCustomerRewardAccount(idToFetch);
      if (fresh) {
        const resolvedBalance = Number(fresh.availableCoins ?? fresh.availableBalance ?? fresh.pointsBalance ?? 0);
        const resolvedEarned = Number(fresh.lifetimeEarned ?? activeCustomer?.lifetimeEarned ?? 0);
        const resolvedRedeemed = Number(fresh.lifetimeRedeemed ?? activeCustomer?.lifetimeRedeemed ?? 0);
        setActiveCustomer((prev) => prev ? ({
          ...prev,
          availableBalance: resolvedBalance,
          lifetimeEarned: resolvedEarned,
          lifetimeRedeemed: resolvedRedeemed,
          tier: fresh.tier || prev.tier
        }) : null);
        toast.success(`Wallet Balance Refreshed: ${resolvedBalance} PINAK Coins (₹${resolvedBalance})`);
      }
    } catch {
      toast.error("Failed to refresh balance from backend");
    }
  };

  const handlePaymentCompleted = (details: any) => {
    const earned = Number(details?.coinsEarned || 0);
    const redeemed = Number(details?.coinsRedeemed || 0);
    const targetCustomerId = details?.customerId || activeCustomer?.customerId;

    setActiveCustomer((prev) => {
      if (!prev) return null;
      const currentBal = Number(prev.availableBalance ?? 0);
      const currentEarned = Number(prev.lifetimeEarned ?? 0);
      const currentRedeemed = Number(prev.lifetimeRedeemed ?? 0);
      return {
        ...prev,
        availableBalance: Math.max(0, currentBal - redeemed + earned),
        lifetimeEarned: currentEarned + earned,
        lifetimeRedeemed: currentRedeemed + redeemed
      };
    });

    if (earned > 0) {
      toast.success(`+${earned} PINAK Coins Credited to your Wallet!`, {
        description: `Live balance updated for ${activeCustomer?.customerName || "Customer"}`
      });
    }

    if (targetCustomerId) {
      setTimeout(() => {
        refreshActiveCustomerBalance(targetCustomerId);
      }, 1000);
    }
  };

  const handleSelectCustomer = (acc: CustomerRewardAccountDTO) => {
    setActiveCustomer(acc);
    if (typeof window !== "undefined") {
      localStorage.setItem("pinak_active_customer_id", acc.customerId);
    }
    setAuthModalTab("wallet");
    toast.success(`Active Customer: ${acc.customerName}`, {
      description: `Live Balance: ${acc.availableBalance} PINAK Coins (₹${acc.availableBalance})`
    });
  };

  const handleLogoutCustomer = () => {
    setActiveCustomer(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("pinak_mobile_token");
      localStorage.removeItem("pinak_active_customer_id");
    }
    setAuthModalTab("otp");
    toast.info("Logged out from customer profile. Switched to Guest Mode.");
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = loginPhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : (cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`);
    setIsSendingOtp(true);
    try {
      const resp = await authApi.sendMobileOtp(formattedPhone, "SMS");
      setOtpSent(true);
      setOtpSessionId(resp.sessionId || "");
      if (resp.otp) {
        setOtpTestCode(resp.otp);
        setLoginOtp(resp.otp);
      }
      toast.success(`OTP sent to ${formattedPhone}`, {
        description: resp.otp ? `Dev Test OTP: ${resp.otp}` : "Check your SMS / WhatsApp"
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginOtp || loginOtp.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }
    const cleanPhone = loginPhone.trim();
    const formattedPhone = cleanPhone.startsWith("+") ? cleanPhone : (cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`);
    setIsVerifyingOtp(true);
    try {
      const resp = await authApi.verifyMobileOtp({
        phone: formattedPhone,
        otp: loginOtp.trim(),
        sessionId: otpSessionId || undefined
      });
      if (resp.token) {
        localStorage.setItem("pinak_mobile_token", resp.token);
      }
      const freshAccounts = await loadDatabaseAccounts();
      const user = resp.user;
      const found = freshAccounts.find((a) => a.customerPhone === formattedPhone || (user && a.customerId === user.id));
      if (found) {
        setActiveCustomer(found);
        localStorage.setItem("pinak_active_customer_id", found.customerId);
      } else if (user) {
        const newAcc: CustomerRewardAccountDTO = {
          id: user.id,
          customerId: user.id,
          customerName: user.name || "Mobile User",
          customerPhone: user.phone || formattedPhone,
          customerEmail: user.email || "",
          availableBalance: 100,
          pendingBalance: 0,
          lifetimeEarned: 100,
          lifetimeRedeemed: 0,
          currency: "INR",
          tier: "SILVER",
          status: user.status || "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setActiveCustomer(newAcc);
        localStorage.setItem("pinak_active_customer_id", user.id);
      }
      setAuthModalTab("wallet");
      toast.success(`Signed in successfully as ${resp.user?.name || formattedPhone}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Invalid OTP code");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleValidatePostmanToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawToken = postmanToken.trim().replace(/^Bearer\s+/i, "");
    if (!rawToken || rawToken.length < 20) {
      toast.error("Please paste a valid JWT token from Postman");
      return;
    }
    setIsValidatingToken(true);
    try {
      const user = await authApi.validateMobileToken(rawToken);
      localStorage.setItem("pinak_mobile_token", rawToken);
      localStorage.setItem("pinak_active_customer_id", user.id);
      const freshAccounts = await loadDatabaseAccounts();
      let balance: any = null;
      try {
        balance = await rewardApi.getRewardBalance();
      } catch {}
      const found = freshAccounts.find((a) => a.customerId === user.id || a.customerPhone === user.phone);
      if (found) {
        setActiveCustomer(found);
      } else {
        setActiveCustomer({
          id: user.id,
          customerId: user.id,
          customerName: user.name || "Mobile User",
          customerPhone: user.phone || user.mobile || "",
          customerEmail: user.email || "",
          availableBalance: balance?.availableBalance ?? balance?.pointsBalance ?? 0,
          pendingBalance: balance?.pendingBalance ?? 0,
          lifetimeEarned: balance?.lifetimeEarned ?? 0,
          lifetimeRedeemed: balance?.lifetimeRedeemed ?? 0,
          currency: "INR",
          tier: balance?.tier || "SILVER",
          status: user.status || "ACTIVE",
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setAuthModalTab("wallet");
      toast.success(`Authenticated from Postman Token!`, {
        description: `Welcome, ${user.name || user.email} (${user.role})`
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Token validation failed. Ensure backend is running and token is valid.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  useEffect(() => {
    if (!appStore.isAuthenticated || !appStore.currentUser) {
      authApi.bootstrapSession().then((user) => {
        if (user) {
          appStore.login((user.role?.toLowerCase() as any) || "customer", user.email, user.storeId, {
            id: user.id,
            name: user.name,
            phone: user.phone || (user as any).mobile,
            roleName: (user as any).staffRoleName || (user as any).roleName,
            status: user.status
          });
        }
      }).catch(() => {});
    }
  }, []);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialStoreId = searchParams?.get("storeId");
  // Public Customer View Mode vs Admin Simulator Mode
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("dev") === "true" || p.get("preview") === "true" || p.get("admin") === "true") {
        return false;
      }
      const saved = localStorage.getItem("pinak_public_mode");
      if (saved !== null) return saved === "true";
    }
    return true; // Default to public customer view!
  });

  useEffect(() => {
    document.title = "PINAK — Deals that Reward you | Local Offers & Dining";
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = p.get("view");
      if (v === "booking") {
        setInitialDetailView("booking");
        setActiveScreen("detail");
      } else if (v === "pay_bill") {
        setInitialDetailView("pay_bill");
        setActiveScreen("detail");
      } else if (v === "orders" || v === "bookings") {
        setActiveScreen("orders");
      }
    }
  }, []);

  const [activeScreen, setActiveScreen] = useState<"home" | "detail" | "orders" | "booking_pass">(initialStoreId ? "detail" : "home");
  const [initialDetailView, setInitialDetailView] = useState<"detail" | "booking" | "pay_bill" | "product_order">("detail");
  const [selectedOfferForDetail, setSelectedOfferForDetail] = useState<any>(null);
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
  const [liveCategories, setLiveCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("All");
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
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
          lng: userLocation.longitude,
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

  // Fetch live categories from PostgreSQL database (/api/v1/categories)
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      setIsLoadingCategories(true);
      try {
        const cats = await categoryApi.getCategories();
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          const active = cats.filter((c: any) => c.status !== "INACTIVE" && c.isActive !== false);
          active.sort((a: any, b: any) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
          setLiveCategories(active);
        }
      } catch (err: any) {
        console.warn("Could not fetch live categories from database:", err?.message);
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const filteredOffers = useMemo(() => {
    if (selectedCategoryId === "all" || selectedCategoryName === "All") {
      return offers;
    }
    const catLower = selectedCategoryName.toLowerCase();
    return offers.filter((o) => {
      if (o.categoryId && (o.categoryId === selectedCategoryId || o.categoryId === selectedCategoryName)) {
        return true;
      }
      const targetStoreId = o.branch?.branchId || o.branchSummary?.storeId || o.storeId;
      const targetStore = appStore.stores.find((s) => s.id === targetStoreId || s.storeId === targetStoreId);
      if (targetStore?.category && targetStore.category.toLowerCase().includes(catLower)) {
        return true;
      }
      if (o.title && o.title.toLowerCase().includes(catLower)) {
        return true;
      }
      if (o.description && o.description.toLowerCase().includes(catLower)) {
        return true;
      }
      const merchantName = o.merchant?.name || o.merchantSummary?.name || "";
      if (merchantName.toLowerCase().includes(catLower)) {
        return true;
      }
      return false;
    });
  }, [offers, selectedCategoryId, selectedCategoryName, appStore.stores]);

  const displayedServiceOffers = deduplicateOffersByStore(filteredOffers);
  const displayedProductDeals = productDeals;
  const displayedFeaturedStores = useMemo(() => {
    if (selectedCategoryId === "all" || selectedCategoryName === "All") {
      return featuredStores;
    }
    const catLower = selectedCategoryName.toLowerCase();
    const filtered = featuredStores.filter((m) =>
      m.categoryName?.toLowerCase().includes(catLower) ||
      m.name?.toLowerCase().includes(catLower)
    );
    return filtered.length > 0 ? filtered : featuredStores;
  }, [featuredStores, selectedCategoryId, selectedCategoryName]);
  const displayedCollections = collections;

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center transition-colors",
      isPublicMode ? "bg-[#f4f5fa] dark:bg-[#090b14] text-slate-900 dark:text-slate-100" : "bg-slate-900 text-slate-100"
    )}>
      {/* ========================================================================= */}
      {/* 1. PUBLIC CUSTOMER APP HEADER (Default for Public Users) */}
      {/* ========================================================================= */}
      {isPublicMode ? (
        <header className="w-full bg-white/95 dark:bg-[#0f1322]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3 sticky top-0 z-50 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-3 sm:gap-6">
            <div
              onClick={() => {
                setActiveScreen("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight font-['Manrope']">
                    PINAK
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800">
                    Deals that Reward you
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  Exclusive Dining, Table Bookings &amp; Instant Cashback
                </p>
              </div>
            </div>
          </div>

          {/* Center: Live Location Selector Pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs"
              title="Change Dining & Discovery Location"
            >
              <MapPin size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{userLocation.name}</span>
            </button>

            {/* Quick Screen Switcher (Explore / Dine / Orders) */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveScreen("home");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeScreen === "home"
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                Explore
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedStoreId) {
                    const firstStore =
                      offers.find((o) => o.branchSummary?.storeId || o.branch?.branchId)?.branchSummary?.storeId ||
                      "a230a164-d4e8-429b-9ca0-2b468946901b";
                    setSelectedStoreId(firstStore);
                  }
                  setInitialDetailView("booking");
                  setActiveScreen("detail");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeScreen === "detail" && initialDetailView === "booking"
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                Book Table
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveScreen("orders");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeScreen === "orders"
                    ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                My Activity
              </button>
            </div>
          </div>

          {/* Right Actions: Coins, Share & Simulator Switch */}
          <div className="flex items-center gap-2">
            {/* Real Coins & Customer Wallet Button in Public Header */}
            {activeCustomer ? (
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("wallet");
                  setShowWalletModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 font-bold text-xs transition-colors border border-amber-200/80 dark:border-amber-800 shadow-2xs cursor-pointer"
                title="View Customer Reward Wallet & Coins"
              >
                <Coins size={14} className="text-amber-600" />
                <span>{Math.round(activeCustomer.availableBalance ?? 0)}</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">({getCustomerInitials(activeCustomer.customerName)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalTab("otp");
                  setShowWalletModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                title="Log In / Sign In with Mobile"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const shareUrl = typeof window !== "undefined" ? window.location.href : "";
                navigator.clipboard.writeText(shareUrl);
                toast.success("Public link copied! Share with friends or open on your phone.");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              title="Copy Public Link to Share"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPublicMode(false);
                localStorage.setItem("pinak_public_mode", "false");
                toast.info("Switched to Developer & Admin Simulator controls");
              }}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
              title="Switch to Developer Simulator Mode"
            >
              <Sliders size={14} />
              <span className="hidden md:inline text-[11px]">Simulator</span>
            </button>
          </div>
        </header>
      ) : (
        /* ========================================================================= */
        /* 2. DEVELOPER / ADMIN SIMULATOR TOOLBAR */
        /* ========================================================================= */
        <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 sticky top-0 z-50 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsPublicMode(true);
                localStorage.setItem("pinak_public_mode", "true");
                toast.success("Switched to Public Customer View");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-bold cursor-pointer shadow-xs"
            >
              <Globe size={13} />
              <span>Public View</span>
            </button>
            <Link
              href="/admin/offers"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-semibold"
            >
              <ArrowLeft size={14} />
              <span>Back to Admin</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm font-['Manrope']">
                PINAK Customer App
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Dev Simulator
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
              <span>Screen 10: Feed</span>
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
              <span>Screen 11: Detail</span>
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
              <span>Screen 12: Orders</span>
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
                <span>Pass</span>
              </button>
            )}
          </div>

          {/* Active GPS Coordinate Simulator Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-inner text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold px-1">
              <Crosshair size={13} className="text-purple-400" />
              <span className="text-[11px] font-bold text-slate-200">GPS:</span>
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">Lat:</span>
              <input
                type="number"
                step="any"
                value={customLatInput}
                onChange={(e) => setCustomLatInput(e.target.value)}
                placeholder="21.112875"
                className="w-18 bg-transparent text-white font-mono text-[11px] focus:outline-none"
              />
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 mr-1 select-none">Lng:</span>
              <input
                type="number"
                step="any"
                value={customLngInput}
                onChange={(e) => setCustomLngInput(e.target.value)}
                placeholder="79.059910"
                className="w-18 bg-transparent text-white font-mono text-[11px] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => applyCustomCoordinates(customLatInput, customLngInput, customRadiusInput)}
              disabled={isApplyingCoords || loading}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              {isApplyingCoords ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              <span>Apply</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLocationMenuOpen((v) => !v)}
              className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              <MapPin size={11} />
              <span>Presets</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="w-full flex justify-center py-0 sm:py-6 px-0 sm:px-4">
        {/* Device Frame / Responsive Container */}
        <div
          className={cn(
            "w-full bg-[#fbfbff] text-slate-800 relative pb-36 transition-all",
            isPublicMode
              ? "max-w-full sm:max-w-[440px] min-h-screen sm:min-h-[880px] sm:rounded-[32px] sm:shadow-2xl sm:border border-slate-200/90 overflow-hidden"
              : "max-w-[430px] min-h-[900px] shadow-2xl rounded-[36px] overflow-hidden border-[6px] border-slate-800 ring-1 ring-slate-700"
          )}
        >
          {/* iOS Status Bar (Only in Dev Simulator Mode) */}
          {!isPublicMode && (
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
          )}

                    {activeScreen === "detail" ? (
            <ServiceDetailPreviewView
              storeId={selectedStoreId}
              userLat={userLocation.latitude}
              userLng={userLocation.longitude}
              customerName={activeCustomer?.customerName || appStore.currentUser?.name}
              customerPhone={activeCustomer?.customerPhone || appStore.currentUser?.phone}
              customerId={activeCustomer?.customerId}
              customerCoins={activeCustomer?.availableBalance}
              initialView={initialDetailView}
              initialOffer={selectedOfferForDetail}
              onBack={() => {
                setInitialDetailView("detail");
                setSelectedOfferForDetail(null);
                setActiveScreen("home");
              }}
              onPaymentSuccess={handlePaymentCompleted}
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
              initialCustomerName={effectivePassBooking.customerName || activeCustomer?.customerName || appStore.currentUser?.name}
              initialCustomerPhone={effectivePassBooking.customerPhone || activeCustomer?.customerPhone || appStore.currentUser?.phone}
              customerId={activeCustomer?.customerId}
              customerCoins={activeCustomer?.availableBalance}
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
              customerId={activeCustomer?.customerId}
              customerCoins={activeCustomer?.availableBalance}
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
                {activeCustomer ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab("wallet");
                        setShowWalletModal(true);
                      }}
                      className="flex items-center bg-amber-50 hover:bg-amber-100/90 transition-colors border border-amber-200/80 px-2 py-0.5 space-x-1 shadow-2xs rounded-md cursor-pointer"
                      title="Click to view Customer Wallet & Coins"
                    >
                      <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[9px] font-black text-amber-900">
                        🪙
                      </div>
                      <div className="text-[10px] font-bold text-amber-900 leading-tight text-left">
                        {Math.round(activeCustomer.availableBalance ?? 0)}
                        <span className="block text-[8px] text-amber-700 font-medium leading-none">
                          ₹{Math.round(activeCustomer.availableBalance ?? 0)} val
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab("wallet");
                        setShowWalletModal(true);
                      }}
                      className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                      title={`${activeCustomer.customerName} (${activeCustomer.customerPhone || "Mobile User"})`}
                    >
                      {getCustomerInitials(activeCustomer.customerName)}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab("otp");
                      setShowWalletModal(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                  >
                    <LogIn size={11} />
                    <span>Log In</span>
                  </button>
                )}
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

          {/* Production Database Hero Promotional Banners Carousel */}
          <section className="px-4 mb-4">
            {(() => {
              const activeBannersList = heroBanners.length > 0 ? heroBanners : [
                {
                  id: "b0000000-0000-0000-0000-000000000001",
                  title: "Mega Dining Carnival 🍽️",
                  subtitle: "Reserve confirmed tables at top restaurants & save flat 50% on food bills",
                  badgeText: "FLAT 50% OFF",
                  imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
                  ctaText: "Book Table",
                  ctaAction: "TABLE_RESERVATION",
                  ctaTargetId: "tbl_dining_fest_2026",
                  themeStyle: "PRIMARY_GRADIENT",
                  displayOrder: 1,
                  isActive: true,
                }
              ];
              const curBanner = activeBannersList[currentBannerIndex % activeBannersList.length];
              const remainingTime = getRemainingTimeText(curBanner.countdownEndTime);
              const gradientClass = getBannerGradient(curBanner.themeStyle);

              return (
                <div
                  onMouseEnter={() => setIsBannerHovered(true)}
                  onMouseLeave={() => setIsBannerHovered(false)}
                  className="relative group rounded-2xl overflow-hidden shadow-lg border border-white/10 select-none transition-all duration-300"
                >
                  {/* High-Res Background Image with Scrim */}
                  {curBanner.imageUrl ? (
                    <div className="absolute inset-0 z-0">
                      <img
                        src={curBanner.imageUrl}
                        alt={curBanner.title}
                        className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
                    </div>
                  ) : (
                    <div className={`absolute inset-0 z-0 bg-gradient-to-br ${gradientClass}`} />
                  )}

                  {/* Decorative glowing orb */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-400/25 rounded-full blur-3xl pointer-events-none" />

                  {/* Banner Content Container */}
                  <div className="relative z-10 p-4.5 sm:p-5 flex flex-col justify-between min-h-[175px]">
                    {/* Top Row: Badge, Countdown & Admin Indicator */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white border border-white/30 shadow-xs">
                          {curBanner.badgeText || "SPECIAL OFFER"}
                        </span>

                        {remainingTime && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/90 text-slate-950 text-[9px] font-extrabold uppercase tracking-tight shadow-xs">
                            <Clock size={10} className="animate-spin text-slate-900" style={{ animationDuration: '4s' }} />
                            <span>{remainingTime}</span>
                          </span>
                        )}
                      </div>

                      {/* Super Admin Quick Link */}
                      <a
                        href="/admin/discovery"
                        target="_blank"
                        rel="noreferrer"
                        title="Manage banners in Super Admin Discovery Control"
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[9px] font-bold text-white/80 hover:text-white bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 cursor-pointer"
                      >
                        <Sliders size={9} />
                        <span>Admin CMS</span>
                      </a>
                    </div>

                    {/* Middle: Headline & Subtitle */}
                    <div className="w-full sm:w-4/5 pr-1 space-y-1 mb-3">
                      <h2 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-md tracking-tight">
                        {curBanner.title}
                      </h2>
                      {curBanner.subtitle && (
                        <p className="text-[11px] text-white/90 font-medium leading-relaxed line-clamp-2 drop-shadow-sm">
                          {curBanner.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: CTA Button + Navigation Dots & Arrows */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/15">
                      <button
                        type="button"
                        onClick={() => handleBannerClick(curBanner)}
                        className="inline-flex items-center space-x-1.5 bg-white text-slate-950 font-black text-[11px] px-3.5 py-1.5 rounded-xl shadow-md hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>{curBanner.ctaText || "Explore Offers"}</span>
                        <ChevronRight size={13} className="text-purple-600" />
                      </button>

                      {/* Interactive Carousel Controls */}
                      {activeBannersList.length > 1 && (
                        <div className="flex items-center gap-2">
                          {/* Previous / Next Arrow buttons on desktop */}
                          <div className="hidden sm:flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBannerIndex((prev) => (prev - 1 + activeBannersList.length) % activeBannersList.length);
                              }}
                              className="p-1 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                              title="Previous Banner"
                            >
                              <ChevronLeft size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentBannerIndex((prev) => (prev + 1) % activeBannersList.length);
                              }}
                              className="p-1 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-xs transition-colors cursor-pointer"
                              title="Next Banner"
                            >
                              <ChevronRight size={12} />
                            </button>
                          </div>

                          {/* Pagination Dots */}
                          <div className="flex items-center gap-1">
                            {activeBannersList.map((b, idx) => {
                              const isActive = idx === (currentBannerIndex % activeBannersList.length);
                              return (
                                <button
                                  key={b.id || idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentBannerIndex(idx);
                                  }}
                                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                                    isActive
                                      ? "w-4 h-1.5 bg-white shadow-xs"
                                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                                  }`}
                                  title={`Go to slide ${idx + 1}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Explore Categories Rail (Live Database Categories) */}
          <section className="mb-5" data-purpose="explore-categories">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Explore Categories</h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Live Database Categories"></span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {selectedCategoryName !== "All"
                      ? `Filtered by: ${selectedCategoryName}`
                      : "Shop products or services from verified stores"}
                  </p>
                </div>
              </div>
              {selectedCategoryName !== "All" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId("all");
                    setSelectedCategoryName("All");
                    toast.info("Showing all categories");
                  }}
                  className="text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Clear Filter
                </button>
              ) : (
                <span
                  onClick={() => toast.info(`${(liveCategories.length > 0 ? liveCategories : FALLBACK_CATEGORIES).length} live categories from database`)}
                  className="text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center space-x-0.5 cursor-pointer"
                >
                  View All ({(liveCategories.length > 0 ? liveCategories : FALLBACK_CATEGORIES).length})
                </span>
              )}
            </div>

            <div className="flex space-x-3.5 overflow-x-auto no-scrollbar px-4 py-1">
              {/* "All" Category Pill */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSelectedCategoryName("All");
                  toast.info("Showing all categories");
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all",
                    selectedCategoryId === "all"
                      ? "bg-purple-700 text-white ring-2 ring-purple-600 shadow-sm scale-105"
                      : "bg-purple-100 text-purple-700 group-hover:scale-105"
                  )}
                >
                  🔥
                </div>
                <span
                  className={cn(
                    "text-[10px]",
                    selectedCategoryId === "all"
                      ? "font-extrabold text-purple-700 dark:text-purple-400"
                      : "font-bold text-slate-700 dark:text-slate-300"
                  )}
                >
                  All
                </span>
              </button>

              {/* Dynamic Live Categories from Database */}
              {(liveCategories.length > 0 ? liveCategories : FALLBACK_CATEGORIES).map((cat: any) => {
                const catId = cat.id || cat.categoryId || cat.name;
                const isSelected = selectedCategoryId === catId || selectedCategoryName.toLowerCase() === (cat.name || "").toLowerCase();
                const visual = getCategoryVisual(cat.name, cat.icon || cat.iconName);

                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategoryId("all");
                        setSelectedCategoryName("All");
                        toast.info("Showing all categories");
                      } else {
                        setSelectedCategoryId(catId);
                        setSelectedCategoryName(cat.name);
                        toast.info(`Filtered by category: ${cat.name}`);
                      }
                    }}
                    className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-xs transition-all",
                        isSelected
                          ? visual.activeBg
                          : `${visual.bg} group-hover:scale-105`
                      )}
                    >
                      {visual.icon}
                    </div>
                    <span
                      className={cn(
                        "text-[10px]",
                        isSelected
                          ? "font-extrabold text-purple-700 dark:text-purple-400"
                          : "font-bold text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* TOP SERVICE OFFERS NEAR YOU (CONNECTED TO BACKEND API) */}
          {/* ========================================================= */}
          <section className="mb-5" data-purpose="service-offers-carousel">
            <div className="flex justify-between items-center px-4 mb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                    Top Service Offers Near You
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Database Feed"></span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedCategoryName !== "All"
                    ? `Showing ${selectedCategoryName} discounts & offers`
                    : "Best discounts on restaurants, salons, gyms & more"}
                </p>
              </div>
              <div className="flex items-center space-x-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-400">
                <span>View All ({displayedServiceOffers.length})</span>
                <ChevronRight size={13} />
              </div>
            </div>

            {/* Horizontal Service Cards Rail */}
            {displayedServiceOffers.length === 0 ? (
              <div className="mx-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                  <MapPinOff size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedCategoryName !== "All"
                      ? `No ${selectedCategoryName} Deals Within ${userLocation.radiusKm} km`
                      : `No Service Deals Within ${userLocation.radiusKm} km`}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                    {selectedCategoryName !== "All"
                      ? `No active offers found for "${selectedCategoryName}" around (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}). Clear category filter or expand radius.`
                      : `Filtering strictly by coordinates (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}). No partner outlets have active service offers here.`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                  {selectedCategoryName !== "All" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId("all");
                        setSelectedCategoryName("All");
                        toast.info("Showing all categories");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Show All Categories</span>
                    </button>
                  )}
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
                const isPreBookingOnly = rType === "PRE_BOOK";
                const isProductDeal = (o.offerScope || "").toUpperCase() === "PRODUCT" || rType === "PRODUCT";

                const expiry = o.expiresAt || o.validTo;
                const badge = formatTimeLeftBadge(expiry);
                const rewardCoins = o.reward?.coins || o.rewardSummary?.coins || o.bonusCoins || 100;
                const imageSrc = o.imageUrl || o.imgUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

                const targetStoreId = o.branch?.branchId || o.branchSummary?.storeId || o.storeId;
                const targetStore = appStore.stores.find((s) => s.id === targetStoreId);
                const isOfferRetail =
                  isProductDeal ||
                  targetStore?.isTableBookingEnabled === false ||
                  /fab|retail|fashion|cloth|apparel|living|decor|jewel|grocery|mart|zara|h&m|supermarket/i.test(
                    (storeDisplayName || "") + " " + (o.title || "") + " " + (targetStore?.category || "")
                  );

                return (
                  <article
                    key={offerKey}
                    onClick={() => {
                      setInitialDetailView("detail");
                      setSelectedOfferForDetail(o);
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
                          ) : isOfferRetail ? (
                            <span className="bg-emerald-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[9.5px] font-extrabold shadow-xs whitespace-nowrap shrink-0">
                              <ShoppingBag size={10} className="shrink-0" />
                              <span className="whitespace-nowrap">In-Store Deal</span>
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
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">{isOfferRetail ? "Retail Outlet" : "Dine-in Outlet"}</span>
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
                          setInitialDetailView("detail");
                          setSelectedOfferForDetail(o);
                          handleOpenStoreDetail(targetStoreId);
                        }}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{o.ctaText || "View Deal"}</span>
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
                onClick={() => {
                  setAuthModalTab(activeCustomer ? "wallet" : "otp");
                  setShowWalletModal(true);
                }}
                className="flex flex-col items-center text-slate-500 hover:text-slate-800 space-y-0.5 min-w-[54px] cursor-pointer transition-colors"
              >
                <div className="relative">
                  <User size={20} />
                  {activeCustomer && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </div>
                <span className="text-[9px] font-medium">{activeCustomer ? "Pocket" : "Sign In"}</span>
              </button>
            </nav>
          )}

          {/* ========================================================================= */}
          {/* REAL PRODUCTION CUSTOMER AUTHENTICATION & WALLET MODAL */}
          {/* ========================================================================= */}
          {showWalletModal && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
              onClick={() => setShowWalletModal(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 p-4 sm:p-5 text-white relative">
                  <button
                    onClick={() => setShowWalletModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>

                  {activeCustomer ? (
                    <div className="flex items-center gap-3.5 pr-8">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black shadow-inner shrink-0">
                        {getCustomerInitials(activeCustomer.customerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black tracking-tight truncate">{activeCustomer.customerName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-amber-950 uppercase tracking-wider shrink-0">
                            {activeCustomer.tier || "GOLD"}
                          </span>
                        </div>
                        <p className="text-xs text-white/90 font-semibold truncate">{activeCustomer.customerPhone || "Verified Mobile Customer"}</p>
                        <p className="text-[11px] text-white/70 truncate">{activeCustomer.customerEmail}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 pr-8">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
                        <Smartphone size={22} />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight">PINAK Customer Gateway</h3>
                        <p className="text-xs text-white/80">Production mobile authentication & database wallet testing</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Tab Bar */}
                  <div className="flex items-center gap-1 mt-4 pt-3 border-t border-white/20 overflow-x-auto text-[11px] font-bold">
                    {activeCustomer && (
                      <button
                        type="button"
                        onClick={() => setAuthModalTab("wallet")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
                          authModalTab === "wallet"
                            ? "bg-white text-purple-900 shadow-xs"
                            : "bg-white/10 hover:bg-white/20 text-white"
                        )}
                      >
                        <Coins size={13} />
                        <span>My Wallet</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAuthModalTab("otp")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
                        authModalTab === "otp"
                          ? "bg-white text-purple-900 shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      )}
                    >
                      <Smartphone size={13} />
                      <span>Mobile OTP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthModalTab("token")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
                        authModalTab === "token"
                          ? "bg-white text-purple-900 shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      )}
                    >
                      <Key size={13} />
                      <span>Postman Token</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab("accounts");
                        loadDatabaseAccounts();
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0",
                        authModalTab === "accounts"
                          ? "bg-white text-purple-900 shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      )}
                    >
                      <Users size={13} />
                      <span>Database Users ({rewardAccounts.length})</span>
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(92vh-200px)]">
                  {/* TAB 1: WALLET & COINS (When logged in) */}
                  {authModalTab === "wallet" && activeCustomer && (
                    <div className="space-y-4">
                      {/* Coins Card */}
                      <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 via-amber-400/5 to-transparent border border-amber-300 dark:border-amber-700/50 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <Coins size={16} className="text-amber-500" />
                            PINAK Reward Wallet
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live PostgreSQL Sync
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">
                            {Math.round(activeCustomer.availableBalance ?? 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-sm font-bold text-amber-600">🪙 PINAK Coins</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                          Instant cash value: <span className="font-black text-emerald-600">₹{(activeCustomer.availableBalance ?? 0).toFixed(2)}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Redeemable for instant bill discounts, counter payments, and pre-book table deposits (1 Coin = ₹1).
                        </p>

                        {/* Lifetime Stats */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-center">
                          <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-medium block">Lifetime Earned</span>
                            <span className="text-xs font-black text-emerald-600">+{activeCustomer.lifetimeEarned || 0} 🪙</span>
                          </div>
                          <div className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-2 border border-slate-100 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 font-medium block">Lifetime Redeemed</span>
                            <span className="text-xs font-black text-rose-500">-{activeCustomer.lifetimeRedeemed || 0} 🪙</span>
                          </div>
                        </div>

                        {/* Refresh Button */}
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => refreshActiveCustomerBalance(activeCustomer.customerId)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <RefreshCw size={13} />
                            Refresh Coins from Database
                          </button>
                        </div>
                      </div>

                      {/* Log Out Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleLogoutCustomer}
                          className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                        >
                          <LogOut size={13} />
                          Sign Out (Switch to Guest Mode)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MOBILE OTP LOGIN */}
                  {authModalTab === "otp" && (
                    <div className="space-y-3.5">
                      <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-3 text-xs text-purple-900 dark:text-purple-200">
                        <p className="font-bold flex items-center gap-1.5">
                          <Smartphone size={14} className="text-purple-600" />
                          Native Mobile Phone Authentication
                        </p>
                        <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                          Authenticates against real backend endpoints (<code className="bg-purple-100 dark:bg-purple-900 px-1 py-0.2 rounded font-mono">/mobile/auth/send-otp</code> & <code className="bg-purple-100 dark:bg-purple-900 px-1 py-0.2 rounded font-mono">/verify-otp</code>).
                        </p>
                      </div>

                      <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Mobile Phone Number
                          </label>
                          <div className="flex gap-2">
                            <div className="flex items-center px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                              🇮🇳 +91
                            </div>
                            <input
                              type="tel"
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                              placeholder="98755 54321"
                              disabled={otpSent}
                              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {!otpSent && (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp || !loginPhone}
                                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                {isSendingOtp ? (
                                  <>
                                    <RotateCw size={13} className="animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Send OTP</span>
                                    <ArrowRight size={13} />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {otpSent && (
                          <div className="space-y-3 animate-in fade-in duration-200">
                            {otpTestCode && (
                              <div className="rounded-xl p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-400 block">
                                    Backend Testing OTP
                                  </span>
                                  <span className="font-mono font-black text-amber-950 dark:text-amber-200 tracking-wider text-sm">
                                    {otpTestCode}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLoginOtp(otpTestCode)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-2xs cursor-pointer"
                                >
                                  Autofill Code
                                </button>
                              </div>
                            )}

                            <div>
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                6-Digit OTP Code
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                value={loginOtp}
                                onChange={(e) => setLoginOtp(e.target.value.replace(/D/g, ""))}
                                placeholder="481920"
                                className="w-full text-center tracking-[0.5em] font-mono text-lg font-black px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isVerifyingOtp || loginOtp.length !== 6}
                              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            >
                              {isVerifyingOtp ? (
                                <>
                                  <RotateCw size={13} className="animate-spin" />
                                  <span>Verifying OTP & Logging In...</span>
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  <span>Verify OTP & Sign In</span>
                                </>
                              )}
                            </button>

                            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false);
                                  setLoginOtp("");
                                }}
                                className="text-purple-600 hover:underline font-semibold cursor-pointer"
                              >
                                Change Mobile Number
                              </button>
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={isSendingOtp}
                                className="text-purple-600 hover:underline font-semibold cursor-pointer"
                              >
                                Resend OTP
                              </button>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  )}

                  {/* TAB 3: POSTMAN JWT TOKEN LOGIN */}
                  {authModalTab === "token" && (
                    <div className="space-y-3.5">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3 text-xs text-indigo-900 dark:text-indigo-200">
                        <p className="font-bold flex items-center gap-1.5">
                          <Key size={14} className="text-indigo-600" />
                          Direct Postman Bearer Token Sign-In
                        </p>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                          When you create a mobile customer in Postman (<code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.2 rounded font-mono">/complete-setup</code> or <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.2 rounded font-mono">/verify-otp</code>), Postman stores <code className="bg-indigo-100 dark:bg-indigo-900 px-1 py-0.2 rounded font-mono">{"{{mobileToken}}"}</code>. Paste it below to immediately authenticate without SMS verification.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Paste JWT Bearer Token from Postman
                        </label>
                        <textarea
                          rows={4}
                          value={postmanToken}
                          onChange={(e) => setPostmanToken(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="w-full p-3 font-mono text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-tight"
                        />
                        <button
                          type="button"
                          onClick={handleValidatePostmanToken}
                          disabled={isValidatingToken || !postmanToken.trim()}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          {isValidatingToken ? (
                            <>
                              <RotateCw size={13} className="animate-spin" />
                              <span>Validating Token with Backend...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} />
                              <span>Authenticate Postman Token & Log In</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DATABASE CUSTOMERS LIST */}
                  {authModalTab === "accounts" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Real PostgreSQL Customer Accounts
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Created via Postman mobile onboarding or database registration
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={loadDatabaseAccounts}
                          disabled={isLoadingAccounts}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800 cursor-pointer"
                        >
                          <RefreshCw size={11} className={isLoadingAccounts ? "animate-spin" : ""} />
                          <span>Refresh DB</span>
                        </button>
                      </div>

                      {/* Filter Search */}
                      {rewardAccounts.length > 3 && (
                        <input
                          type="text"
                          value={accountSearchFilter}
                          onChange={(e) => setAccountSearchFilter(e.target.value)}
                          placeholder="Search customer by name or phone..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      )}

                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {rewardAccounts.length === 0 ? (
                          <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                            <p className="text-xs font-bold">No customers found in database</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Run your Postman collection to create a customer, then click Refresh above!
                            </p>
                          </div>
                        ) : (
                          rewardAccounts
                            .filter((a) => {
                              if (!accountSearchFilter.trim()) return true;
                              const q = accountSearchFilter.toLowerCase();
                              return (
                                (a.customerName || "").toLowerCase().includes(q) ||
                                (a.customerPhone || "").includes(q) ||
                                (a.customerEmail || "").toLowerCase().includes(q)
                              );
                            })
                            .map((account) => {
                              const isSelected = activeCustomer?.customerId === account.customerId;
                              return (
                                <div
                                  key={account.id || account.customerId}
                                  onClick={() => handleSelectCustomer(account)}
                                  className={cn(
                                    "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left",
                                    isSelected
                                      ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-xs"
                                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  )}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                                        isSelected
                                          ? "bg-purple-600 text-white"
                                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                      )}
                                    >
                                      {getCustomerInitials(account.customerName)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {account.customerName}
                                        </span>
                                        {isSelected && (
                                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {account.customerPhone || "No phone"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="flex items-center gap-1 justify-end font-black text-xs text-amber-700 dark:text-amber-400">
                                      <span>🪙</span>
                                      <span>{Math.round(account.availableBalance ?? 0)}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      {account.tier || "GOLD"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[240px]">
                    {activeCustomer ? (
                      <>
                        Active: <strong className="text-slate-700 dark:text-slate-200">{activeCustomer.customerName}</strong>
                      </>
                    ) : (
                      "Guest Customer (Not Logged In)"
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
