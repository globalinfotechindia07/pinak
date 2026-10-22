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
  Tag,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import apiClient from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [productDeals, setProductDeals] = useState<ProductDeal[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedMerchant[]>([]);
  const [collections, setCollections] = useState<PopularCollection[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(10);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState({
    name: "100ft Rd, Indiranagar",
    city: "Bengaluru, Karnataka",
    latitude: 12.9716,
    longitude: 77.6412,
    radiusKm: 15.0
  });

  const PRESET_LOCATIONS = [
    {
      name: "100ft Rd, Indiranagar",
      city: "Bengaluru, Karnataka",
      latitude: 12.9716,
      longitude: 77.6412,
      radiusKm: 15.0
    },
    {
      name: "West High Court Rd, Dharampeth",
      city: "Nagpur, Maharashtra",
      latitude: 21.1458,
      longitude: 79.0882,
      radiusKm: 15.0
    }
  ];

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
    }

    try {
      const pRes = await apiClient.get("/offers/nearby", {
        params: {
          type: "PRODUCT",
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: userLocation.radiusKm,
          limit: 10
        }
      });
      const pData = pRes.data?.data;
      const pList = Array.isArray(pData?.offers) ? pData.offers : Array.isArray(pData) ? pData : [];
      if (pList.length > 0) {
        setProductDeals(
          pList.map((item: any) => {
            const orig = item.originalMrp ? Number(item.originalMrp) : undefined;
            const deal = item.flashSellingPrice ? Number(item.flashSellingPrice) : (Number(item.discountValue || item.value) || 0);
            const pct = (orig && deal && orig > deal) ? Math.round(((orig - deal) / orig) * 100) : Number(item.discountValue || item.value || 0);
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
              storeName: item.branch?.name
            };
          })
        );
      }
    } catch (err: any) {
      console.warn("Could not fetch live product deals:", err?.message);
    }

    try {
      const fRes = await apiClient.get("/merchants/featured", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          limit: 10
        }
      });
      const fData = fRes.data?.data;
      const fList = Array.isArray(fData?.merchants) ? fData.merchants : [];
      if (fList.length > 0) {
        setFeaturedStores(fList);
      }
    } catch (err: any) {
      console.warn("Could not fetch live featured merchants:", err?.message);
    }

    try {
      const cRes = await apiClient.get("/collections/popular", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: userLocation.radiusKm || 15.0,
          limit: 10,
        },
      });
      const cData = cRes.data?.data;
      const cList = Array.isArray(cData?.collections) ? cData.collections : [];
      if (cList.length > 0) {
        setCollections(cList);
      }
    } catch (err: any) {
      console.warn("Could not fetch popular collections:", err?.message);
    }

    try {
      const fRes = await apiClient.get("/offers/flash", {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          limit: 10,
        },
      });
      const fData = fRes.data?.data;
      const fList = Array.isArray(fData?.deals) ? fData.deals : [];
      if (fList.length > 0) {
        setFlashDeals(fList);
      }
    } catch (err: any) {
      console.warn("Could not fetch live flash deals:", err?.message);
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

  // Fallback demo product deals from code.html
  const fallbackDemoProducts: ProductDeal[] = [
    {
      id: "demo-p1",
      title: "Amul Fresh Milk",
      unitOrWeight: "1 Litre",
      dealPrice: 52,
      originalPrice: 65,
      discountPct: 20,
      discountBadge: "20% OFF",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs3waAQbgzW6ulcWgCbnSxbpZN_13ZJXWzm4X2qAl0vMuum2WR04QFvNkO8dtZdx7jm6Hx-4Yv-UOTJvm_T1_zP-BjcNgu-n36fI1NJbiNiDN6iATJvnTI3PZFH9s3mrPOOkbC6anaq1aeOnanPe9Jc7mJ3mhPvignPOty3w2-rM7g19DmmRog4WK1HSwTg6I3iNANpsvacjgVB8XlD2SaJ5lauRM86etGCZnk70_yZwEM-f1ui0Vd"
    },
    {
      id: "demo-p2",
      title: "India Gate Basmati Rice",
      unitOrWeight: "5 kg",
      dealPrice: 540,
      originalPrice: 600,
      discountPct: 10,
      discountBadge: "10% OFF",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAz3pTi8RkZpVw-Mr8tM5TAVW9Dl52lt8OT816AYoIq9TJciz5RZiVqam6VcVx6sW0eHkx1AIsMU_2cJQnOVUCV_IsPb5ebrpge7RJgrt7_UolSuNwhci2MERrxPmWqzsSDf9lIz1ejVVwqN1p2Tqt7z2H8zJcBLccInJxlWFHuXUO9pdnl62dGbzHOHafQcu5_8dty0RVNA6-oxEzRekQ_W5lhkTuggAod0xEPnSZqWT2hebkFAl3V"
    },
    {
      id: "demo-p3",
      title: "Maggi 2-Min Noodles",
      unitOrWeight: "70 g",
      dealPrice: 28,
      originalPrice: 32,
      discountPct: 13,
      discountBadge: "Buy 2 Get 1",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD85STcU1nutJDJ0krl4bTkoIPmaJ4PD8EjDXxLt-3Wn97ov26ZRK_SgQz8XHHhygaSlXOwxm0aLDFgmOu9U2WwN_95PeXogGINTBsN7dXzUQy2oBGxucmNu9hQEbQmEHzwp5jNKXMetSnvoYnYlLJefb5wPnXog5WI-ZbK496lXs2rlF6L_D7_gM36Sat4HKXCWbX4zLOgCJftTO1Y9PBzQcX7uXfvPaYD0tsmT6Klx91ng021rARr"
    },
    {
      id: "demo-p4",
      title: "Dettol Handwash",
      unitOrWeight: "200 ml",
      dealPrice: 98,
      originalPrice: 140,
      discountPct: 30,
      discountBadge: "30% OFF",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCT4YsSGn2-d3Ilg8GHUkjkbinPLHR9X7q1_ktSZMPpciUeZoEQEfzw0LYfSquH_5RyfBDIkaosS0Je6owvBIo-sDrn7OO0OBVdhRUVGkPxJJ0k1ju-EDmtXI5ajKvspfNIgdQctKkkZbXNRLJGJcSayNJgveLO7508KddEnkITFslKiMq3BsawnrhljZliemhFYYh4ImVZE-DuRIrI932ZwijmQEMqdv9LeTOwdA4KGdN488AuFMeH"
    },
    {
      id: "demo-p5",
      title: "Stanley Hammer",
      unitOrWeight: "500 g",
      dealPrice: 340,
      originalPrice: 400,
      discountPct: 15,
      discountBadge: "15% OFF",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdLPvNB0gngUt-ujV1sfzj6KGKpuoYJ5Zy68KjG0y1lOvGHx8a_FqXWold9KzYAkdgq4NHXMBc8sSqBiejzd4WpS-SB76zcwbkGXEq9Pe3ntKM4Vmo1XR8LZLgVbm9JfSa7-E-lEf0xB2X--imbz0tIZH0LMxoQ654s5_py6rGYrbv2tE5lRD-qpawWz8Qd3Tv6xjcd2VcEeGziNoRZ-Xyfjp6WeLK6bRSxWanjCq5stC_t_0Cb6kM"
    }
  ];

  // Fallback demo featured stores from code.html
  const fallbackFeaturedStores: FeaturedMerchant[] = [
    {
      merchantId: "a1111111-1111-1111-1111-111111111101",
      name: "BigBasket",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpywPVartWEpSPnrIqJ1fh271avfu6p7sqwKBxw3XBO_XZVFOrecXycpjLxoKWgLURGtfURISdqZldiRMsfNWNjiEGrdOxsnV9AUV8gLIB2giL2oXuL2lvzqEtpAWgK2gpPvUjNuz-hIC617u_1JLe65ZjEhCwKHSZSGqaA3655Cnw2cW8v6ZptHiJhETagFmz92tlrfQ_QnLwt6ax9cdOq8ALs-kbrCFP9MXzRpHqxsPtyJqUbcYn",
      categoryName: "Supermarket",
      rating: { average: 4.6, count: 1200 },
      distanceMeters: 800,
      bestOffer: { label: "10% off on select items" },
      isVerified: true
    },
    {
      merchantId: "a1111111-1111-1111-1111-111111111102",
      name: "Reliance Fresh",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCO5gXpRpjf8te01togUL-QPKYmCCQR71RnYMfy9GTE5Fd7MS4J1ZCiBy9ANigvj8tSWYe_rDg113vvdk7_kIPfeRjFypYicZ4D7JbNrw0uQJ9vidqFXPQoS0kmv6QNlNZiiSxnMn475kBBcV55qLV6ObkKUEq-ll_Xr1Mj47HSQaG1WlZh4iU8wcYhhdlE4og04O0iW_noithDS6cmsWUWlAzsyyPSkFf7-grB6uVCwc9j-qK-nvin",
      categoryName: "Supermarket",
      rating: { average: 4.4, count: 1200 },
      distanceMeters: 1200,
      bestOffer: { label: "Flat ₹100 off on ₹1,000+" },
      isVerified: true
    },
    {
      merchantId: "a1111111-1111-1111-1111-111111111103",
      name: "Sharma Kirana Store",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAY5mmetrbn8RyNFJem02htY14un3y2sTrwETInC-zBXecoT0uMNmktEE2eMtjDBn1C0qbUYBsqdTYKhwy2taVrUWzH40IvG6f5Ie68eUfgrhjs4JfY6gdh199RSbCQP79r_BCiGR0HKDpKvksLp-Z4a7vtHkqPKBSb_OqXXKLK_p_783yGo-dlGgSgYlE0ynS6pHfb5_-gIh_RDQe5pcvwMzllgxTqtAi-G-FEYoc3V9SwWXiUoG5O",
      categoryName: "Kirana & Daily Needs",
      rating: { average: 4.5, count: 1200 },
      distanceMeters: 900,
      bestOffer: { label: "Free delivery above ₹299" },
      isVerified: true
    },
    {
      merchantId: "a1111111-1111-1111-1111-111111111104",
      name: "More Supermarket",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuANYyKD7SnBu1JTaFAPSa6XnxWAZDVFZoLpeEKcjj3tdXQoyCzuuiWJj7INQSTeLK8fsWArMDPHN4d6i97-G2CasE1ufVtrBKW7MfDoRJtPWhyQQvi2JR8hklyw-wrLP7oesvK37V_M-kzV5HpV5zV16wdRcH46bRnHzSoTAWaD8_fr50wooKq1hko3H1hMZil584XQam6XP5cXRTRKIb4DojxpA7aM0A9anaEffgdlwHfTaw9f7aVW",
      categoryName: "Supermarket",
      rating: { average: 4.3, count: 1200 },
      distanceMeters: 1600,
      bestOffer: { label: "Up to 20% off" },
      isVerified: true
    }
  ];

  const fallbackCollections: PopularCollection[] = [
    {
      id: "11111111-1111-1111-1111-111111111103",
      title: "Supermarket",
      subtitle: "BigBasket, Reliance Fresh & more",
      badgeText: "Up to 50% OFF",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpywPVartWEpSPnrIqJ1fh271avfu6p7sqwKBxw3XBO_XZVFOrecXycpjLxoKWgLURGtfURISdqZldiRMsfNWNjiEGrdOxsnV9AUV8gLIB2giL2oXuL2lvzqEtpAWgK2gpPvUjNuz-hIC617u_1JLe65ZjEhCwKHSZSGqaA3655Cnw2cW8v6ZptHiJhETagFmz92tlrfQ_QnLwt6ax9cdOq8ALs-kbrCFP9MXzRpHqxsPtyJqUbcYn"
    },
    {
      id: "11111111-1111-1111-1111-111111111101",
      title: "Dining",
      subtitle: "The Bombay Canteen & Haldiram's Sweets & Snacks",
      badgeText: "Up to 40% OFF",
      coverImageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&q=80"
    },
    {
      id: "11111111-1111-1111-1111-111111111104",
      title: "Kirana",
      subtitle: "Sharma Kirana Store",
      badgeText: "Up to 30% OFF",
      coverImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAY5mmetrbn8RyNFJem02htY14un3y2sTrwETInC-zBXecoT0uMNmktEE2eMtjDBn1C0qbUYBsqdTYKhwy2taVrUWzH40IvG6f5Ie68eUfgrhjs4JfY6gdh199RSbCQP79r_BCiGR0HKDpKvksLp-Z4a7vtHkqPKBSb_OqXXKLK_p_783yGo-dlGgSgYlE0ynS6pHfb5_-gIh_RDQe5pcvwMzllgxTqtAi-G-FEYoc3V9SwWXiUoG5O"
    }
  ];

  const recentlyViewedItems: RecentlyViewedItem[] = [
    {
      id: "rv-1",
      title: "Amul Fresh Milk",
      unit: "1 Litre",
      dealPrice: 52,
      originalPrice: 65,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_2XWCwUR-vNhnMYRogZE5BxOHD5tvFlIBEroQwTtHW3782cxy3J_gj1vQTpSKBJdMvqjy8uGwEfKsoub8Bz6B8zfkWU010CQQBmjfTVf3Q8UBUn6ZDjBFmV3VcD_86Hefg9c320lIlYsgoSCNfrJStXvebXbHLAj99C3p95gcc1NhXnR7X95qHgvmTGMAvTrjPA_nWw1AbqYLLRn7yA5-zw3SnXA0sQe1GsvonrO_tei27BYpopNq"
    },
    {
      id: "rv-2",
      title: "India 2-Min Noodles",
      unit: "5 kg",
      dealPrice: 28,
      originalPrice: 32,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6vFoAVk9qn4U7jVocOqgf-OGHkvKwvAogRWwRsWlCXowre5wTXmYAsFUwZaBqzUIB7aRjL4pF9ldDmoP3TrF8SpoivTaORak-zj8nIF0Ree480KEmjCuN_p002Ydor_34SMTq2YDAo0vO68NnXliOmDjnKPmo5UfUQgMosCnRoFrRLmV-Kboty0mEDhFC-gc6aybP9rI7NnLHWHYqXZg20k64AVVsqB1h7xsCnmAQACFP6kkizXBq"
    },
    {
      id: "rv-3",
      title: "Dettol Handwash",
      unit: "700 ml",
      dealPrice: 98,
      originalPrice: 140,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCreckqKusFoa5QW945b8RNx-6g_J9zlNcL9EOpa5N5sPX5_W0rirzxZLyn-ixoc70h5zgY4EtEVnAxAfIQ5VZ2nGNKdq72htR9Im24ymP7LxhYhCPxgXk3GHlkEz9ZkOItbTrn-D_WWyEzAbm6CDjpKK9hNKT2OLONmbrQHovAbR0oiYdU53t9-vnirA6GNZvUHzpwqoXjbruXIjecq58ZC0ZWtbxJtwyCdJRJSPol0fsRIhjdyx8s"
    },
    {
      id: "rv-4",
      title: "Stanley Hammer",
      unit: "500 g",
      dealPrice: 340,
      originalPrice: 380,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoomq9l_nkiSS9_QY0zNOH9cSglU5ygxqQawl4XJF2SqdQ-YSZFMeqVNNpvygzzyAoGNT-a7Rpu5ZllgM3aLOTVFOvDw7FrjxFI9Bk7sVHr9ASdECHTJOKvxEDtD9PgDdA-UHUq7t8xu77vNVZtWofLdkR4lCWLw4HhvkGC26c8ljqtFNQvwJzK94a_Zw_TtTkQ7Sg9AOpfNDOf2QqyTDV0UXsh8Q28kf5BVAsNseqJZ9-_2pdyr2U"
    },
    {
      id: "rv-5",
      title: "India Gate Rice",
      unit: "500 g",
      dealPrice: 540,
      originalPrice: 680,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuABQbLqPxidkIWnahYpif8R4SXTzjTE4XR_muh0lM5OWwTckJrBPA7m5pb2HOoNdYQLLhSRfm-qxhgUcf9fnxYvVInulnossCNVC8C9zornP9VGa3bwBjffcXCgQSz9QyKtMZr-q8x0hp0VibXIG42zTwybQWJXQwOHY79cWHksPUbkfjpHAy_rIfgVQJCPh5tNNwkcorkxwR-wKKevEj2Y3OyxoHwP4Z2nqVLy19xi1jh5Oc_O6trw"
    }
  ];

  const recommendedItems: RecommendationItem[] = [
    {
      id: "rec-1",
      title: "Truffles Burgers",
      badge: "Based on your dining visits",
      distanceCategory: "800m • Burgers & Shakes",
      discountBadge: "Flat 25% OFF",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcQ6yo-UlptTXMC1ZgJc7hzg7i2kJi0aq51wlapezX3go7pXLpHBd2K9ID3IlqNyKHpUVeQJwwZi0CyX2y88MhTwn91rZBqSlvs1ohhREGDsl9A0wTmG-Mn944GPpAkIiTBRZHTN-7xpZzfJlfsvCfx6i_H_ogkun3JgU5gv-Xf0gndDNOPPpxiZWaZqpYGhR1ZFNCmz-1ekyF9Dj7hhEEAZ4hM_9P5a8XAkZbItSGLuNmq3paGSf8"
    },
    {
      id: "rec-2",
      title: "Cult.Fit Pro",
      badge: "Trending near you",
      distanceCategory: "850m • Fitness & Gym",
      discountBadge: "3-Day Pass + 25% Off",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAPF7nqQbm0sCbVW2LHPauye1ipsfVDS4mWNvDclJS_1YTH56g-pAlUbVg8eVHveT2czNkeEssn0ylzRKh2lE0yRBQKdBkZZY7WtDU-5Aio_DW5qhmx27ndpkUmFQqDylI7CACtvC0lkrBDKqce6hWHTmWfl265XymEkX1IZBlOUIeSIom5CY2IrVNLETtJgsiPLA-ThyJRE211fiVvYgtLnZo4ab5P8UqFQI64v_JBZoRBl7iZBEh"
    },
    {
      id: "rec-3",
      title: "Bodycraft Spa",
      badge: "Similar to your interests",
      distanceCategory: "1.2km • Salon & Wellness",
      discountBadge: "Flat 30% Off Mon-Thu",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfT45o6_G73TaXK_SHKiFckXQlmqa39zYZirk-zH-YMAN_sJLP5kWGJnJsgwX6jI3n_Yg75yIA1U4RqnO7s1KLF4bWr0-xrQyHoAGV4LZZTshdZGJ_EcSHZG7oQXzDB9G2bJXoE4JZ3KyOhsk6ihz9JwnXOwp7EyEd65us_X9RyfAZmLAcVaiZlDcO75PfGKC3zL0_hg0-kJB1Y5i-v6LGfOgVtfzB742B8je0OiAolc6PDUAZHRC7"
    }
  ];

  const rawOffers = offers.length > 0 ? offers : fallbackDemoOffers;
  const displayedServiceOffers = deduplicateOffersByStore(rawOffers);
  const displayedProductDeals = productDeals.length > 0 ? productDeals : fallbackDemoProducts;
  const displayedFeaturedStores = featuredStores.length > 0 ? featuredStores : fallbackFeaturedStores;
  const displayedCollections = collections.length > 0 ? collections : fallbackCollections;

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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLocationMenuOpen((v) => !v)}
                  className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 transition-colors max-w-[170px] rounded-lg text-left cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{userLocation.name}</p>
                    <p className="text-[9px] text-slate-500 truncate leading-none">{userLocation.city}</p>
                  </div>
                </button>

                {isLocationMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-slate-900">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 py-1">
                      Select GPS Discovery Point
                    </span>
                    {PRESET_LOCATIONS.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setUserLocation(loc);
                          setIsLocationMenuOpen(false);
                          toast.success(`Switched GPS point to ${loc.name}`);
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer flex items-start gap-2",
                          userLocation.name === loc.name ? "bg-purple-50 text-purple-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <MapPin size={12} className={userLocation.name === loc.name ? "text-purple-600 shrink-0 mt-0.5" : "text-slate-400 shrink-0 mt-0.5"} />
                        <div className="min-w-0">
                          <p className="truncate leading-tight">{loc.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal leading-tight">{loc.city} ({loc.latitude}, {loc.longitude})</p>
                        </div>
                      </button>
                    ))}
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

            {/* Horizontal Product Card Rail */}
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
                    <div className="h-24 w-full flex items-center justify-center p-2 mb-1 bg-white rounded-lg overflow-hidden">
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
                      <h4 className="text-[11px] font-bold text-slate-800 truncate" title={p.title}>
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

            {/* Horizontal Stores Rail */}
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
                      toast.success(`Opening ${store.name}`, {
                        description: `${store.categoryName || "Store"} • ${store.bestOffer?.label || "Special offers available"}`
                      });
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

            {/* Horizontal Cards for Curated Collections */}
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
          </section>

          {/* ========================================================= */}
          {/* RECENTLY VIEWED (FROM CODE.HTML) */}
          {/* ========================================================= */}
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
              {recentlyViewedItems.map((item) => (
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

          {/* ========================================================= */}
          {/* RECOMMENDED FOR YOU (FROM CODE.HTML) */}
          {/* ========================================================= */}
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
              {recommendedItems.map((rec) => (
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

                <button
                  type="button"
                  onClick={() => toast.info(`Viewing all ${flashDeals.length} live flash deals`)}
                  className="bg-white text-purple-950 text-[10px] font-extrabold px-3 py-1.5 flex items-center space-x-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <span>View All Deals</span>
                </button>
              </div>

              {/* Live Flash Deal Cards Rail */}
              {flashDeals.length > 0 && (
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
              )}
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
