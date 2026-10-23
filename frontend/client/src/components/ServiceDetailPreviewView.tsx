import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Image as ImageIcon,
  CheckCircle2,
  Star,
  Compass,
  Phone,
  ChevronRight,
  Sparkles,
  Bolt,
  CreditCard,
  Check,
  Info,
  Utensils,
  BookOpen,
  MapPin,
  ExternalLink,
  Headphones,
  Clock,
  X,
  Plus,
  QrCode,
  ShieldCheck,
  Wine,
  Car,
  CalendarCheck,
  Wifi,
  Fan,
  Music
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
    icon: string;
    title: string;
    description: string;
    badgeText: string;
  };
  availableTabs: string[];
  offersSection: {
    activeOffersCountText: string;
    primaryOffer: any;
    preBookingOffers: any[];
    walkInOffers: any[];
    partnerChips: any[];
    greenPerkHighlight: string;
  };
  flashSales: {
    sectionTitle: string;
    badgeText: string;
    viewAllText: string;
    deals: any[];
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

// Canonical fallback matching code.html 1-to-1 if backend is temporarily offline
const canonicalSmokehouseGrillData: ServiceDetailData = {
  id: "e1000000-0000-0000-0000-000000000001",
  storeName: "The Smokehouse Grill",
  merchantName: "The Smokehouse Grill",
  isVerified: true,
  coverImageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB8sfPzLvi2G05SeAwuufjLXA_kvWfLUTikYVhJSvbZGuQRzNq3abJrWT1rA0qose5tdl6ncsg9hsaJPUBZJT-MSWQUacHb2Cs8an9pw-L6e1T5u8m4KzXGBhRQbcnc1rbq8PocTgITG8auwxoeOdSkxAaXjkcVccYEF2rcFXEKGE5hJKBOO2ANnbK2ABoAmGpnOcBs1R3CdExDFxNxJobZJgsHpOEavPI6G9Zz2yMGJ-xg2NO2bXOb",
  heroPhotos: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB8sfPzLvi2G05SeAwuufjLXA_kvWfLUTikYVhJSvbZGuQRzNq3abJrWT1rA0qose5tdl6ncsg9hsaJPUBZJT-MSWQUacHb2Cs8an9pw-L6e1T5u8m4KzXGBhRQbcnc1rbq8PocTgITG8auwxoeOdSkxAaXjkcVccYEF2rcFXEKGE5hJKBOO2ANnbK2ABoAmGpnOcBs1R3CdExDFxNxJobZJgsHpOEavPI6G9Zz2yMGJ-xg2NO2bXOb",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqzWP_s7LYFCtMBMRVsyBJtuTpVgBgKc8rSbvIMpkTchhreeML5w0zpTdSm9YQYsdfSw5-7GB-s0Qnz_vrRXmXPOTBsdT24Jt3T4jGwwzwzVtEp2luDTbTtDO4bWJoqQi0zQ1oIp4tEfoG7Ur4E1mEreychFIgE36PlQVtL9bwGl28myPd9nlER9mzdGv8FGwall41zQ2qvrVcXHt4o-oD620UJr2f3toGu1T1g0w25Fn2YMiIkHK",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBR_CflBHpsyUsnU4_FVtj3ElQiklZejKLne2z2J_nOeL3hDY8MFWW1d8wdRDt5PUG-n0ogEvFp6ZRLhX7qproqpPxSBGpVXfQjjfu3I1mpHBhDPtXPVcsaT_UrSa45nNXRnCeMoDJGwluhfYLdJV7rwy_s2a8-vJBlmIQP9mWeHwJYeoLvReh88mfIqHRnxczb7FQCxJ0YKRjIoI2oOsdfO8nEEvGNnSf05Z4P22NtQzRsXo0rRS5u",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDBGOjFiQrZo3yQ2E05SAlyhyVw8aVxyTmnp1-QQEaa_XJ8wdl-rnuKbp3wywjVt16MWex1JI5tB2wfe91mvccSkVAo76-E6aUfQm0Z2bvrxwKk8VcLWN4VZ2XGRxxBK4_ZPPRyeeeWpRUYfADb_eXXLcWIEpH8cluV8yw_51gEHslm0lNV7wUmGnFz6jg7MMMVst0BTTb4aWo-fR6JNdd2EXm7bEaTvAb1BULNxQNbTUhIlbl5a1mW"
  ],
  totalPhotosCount: 19,
  photoCounterText: "1/19",
  distanceMeters: 4600,
  distanceText: "4.6 km • Indiranagar, Bengaluru",
  cuisines: "North Indian, Italian, BBQ",
  priceForTwoText: "₹1700 for two",
  cuisineAndPriceText: "North Indian, Italian, BBQ • ₹1700 for two",
  rating: 4.8,
  ratingCountText: "1.2K ratings",
  isOpenNow: true,
  openStatusText: "Open till 12:30 AM",
  openingTime: "12:00 PM",
  closingTime: "12:30 AM",
  phone: "+919880011234",
  latitude: 12.9715987,
  longitude: 77.6411543,
  address: "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
  googleMapsUrl: "https://maps.google.com/?q=12.9715987,77.6411543",
  coinPerkBanner: {
    icon: "bolt",
    title: "Earn & Redeem 2X PINAK Coins",
    description: "Pay via PINAK Pay to get flat 10% back in coins on every visit",
    badgeText: "AUTO-APPLY"
  },
  availableTabs: ["Offers", "Menu", "Photos", "Amenities", "Reviews", "Similar Places"],
  offersSection: {
    activeOffersCountText: "4 Available",
    primaryOffer: {
      id: "e3000000-0000-0000-0000-000000000001",
      title: "Flat 50% off on Total Bill",
      description: "Available on Mon-Sun • Valid on minimum bill ₹1,000",
      discountType: "PERCENTAGE_DISCOUNT",
      discountValue: 50,
      badges: ["PINAK Exclusive", "Special Deal", "Instant"],
      termsNote: "Auto-applied at checkout",
      ctaText: "Book & Pay"
    },
    preBookingOffers: [
      {
        id: "e3000000-0000-0000-0000-000000000001",
        title: "Flat 50% off on Total Bill",
        description: "Available on Mon-Sun • Valid on minimum bill ₹1,000",
        discountType: "PERCENTAGE_DISCOUNT",
        discountValue: 50,
        badges: ["PINAK Exclusive", "Special Deal", "Instant"],
        termsNote: "Auto-applied at checkout"
      },
      {
        id: "e3000000-0000-0000-0000-000000000002",
        title: "Pre-Book Dining Pass: Flat 35% OFF on Reservation",
        description: "Valid on advance bookings • Min bill ₹1,200",
        discountType: "PERCENTAGE_DISCOUNT",
        discountValue: 35,
        badges: ["Pre-Booking Only", "Special Deal", "Instant"],
        termsNote: "Auto-applied on table booking"
      },
      {
        id: "e3000000-0000-0000-0000-000000000004",
        title: "Celebration Feast Pack: Flat ₹600 OFF on Tables of 4+",
        description: "Special group dining perk • Min bill ₹2,500",
        discountType: "FIXED_DISCOUNT",
        discountValue: 600,
        badges: ["Group Feast", "Special Deal", "Instant"],
        termsNote: "Applies to total table bill"
      }
    ],
    walkInOffers: [
      {
        id: "e3000000-0000-0000-0000-000000000003",
        title: "Craft Cocktail Happy Hours: 1+1 on Artisanal Drinks",
        description: "Order any cocktail & get next free • Mon-Fri 4PM-8PM",
        discountType: "BOGO",
        discountValue: 100,
        badges: ["Walk-In Deal", "Special Deal", "Instant"],
        termsNote: "Valid at bar & dine-in tables"
      },
      {
        id: "e3000000-0000-0000-0000-000000000001",
        title: "Flat 50% off on Total Bill",
        description: "Available on Mon-Sun • Valid on minimum bill ₹1,000",
        discountType: "PERCENTAGE_DISCOUNT",
        discountValue: 50,
        badges: ["PINAK Exclusive", "Special Deal", "Instant"],
        termsNote: "Auto-applied at checkout"
      }
    ],
    partnerChips: [
      { id: "chip-1", title: "20% Cashback", subtitle: "in PINAK Coins", badgeText: "20%" },
      { id: "chip-2", title: "Flat 10% off", subtitle: "HDFC / ICICI cards", badgeText: "BANK" }
    ],
    greenPerkHighlight: "Earn 2X Coins on all table bookings & instant UPI pay"
  },
  flashSales: {
    sectionTitle: "Flash Sale Deals",
    badgeText: "LIMITED",
    viewAllText: "View all (3)",
    deals: [
      {
        id: "deal-1",
        title: "BBQ Platter (Serves 2)",
        dealPrice: 649,
        originalPrice: 929,
        discountBadge: "30% OFF",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB3FPGd-pxfQzAmlB1mQ2SSZNA-HVma4hM-tDquN-3f4FReS13wC1uP0--yWt_XuWxjj8o7oi8thfyxxRBO5UJn1kHBIsvI9AJtrOUMXTGbTZIs807XpzY-Bqybyv3Pqe-Qta8U9RmvcP1ZURbxizgsybz5CAbWPoICtiUyFAnBJLlNMUEdJtRJItDJ3Y8wTL2fFlieUMQ--AAYDIDsxMq-4GMvY_LtVDTBGzBDVbHz_HNdx4GiY0HV"
      },
      {
        id: "deal-2",
        title: "Loaded Fries Supreme",
        dealPrice: 299,
        originalPrice: 375,
        discountBadge: "20% OFF",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAJJGr_rN5f3UFqIdvQBN2cCleS_OobUHwPf3AYs04KTBPoWWP_Dr9Z3PIChU4CslsfLqYxgCrV7h27wfHl_TipN9K1DMY45Jo8b03qS6zhGKxIpASNQOSKUILZ9Sd9rNkvEPgPhlbvMt1bRLUbeWTGxvt8bAk4sGkteUXA3OKet4uPUbuqcpcuC0eQDHm0augTaGNTJGH8M0-MqZmpuVoilad_Me-XW3-STrcobgPIiFPvW14AjGY2"
      },
      {
        id: "deal-3",
        title: "Smoked Wings (6 Pcs)",
        dealPrice: 329,
        originalPrice: 440,
        discountBadge: "25% OFF",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqzWP_s7LYFCtMBMRVsyBJtuTpVgBgKc8rSbvIMpkTchhreeML5w0zpTdSm9YQYsdfSw5-7GB-s0Qnz_vrRXmXPOTBsdT24Jt3T4jGwwzwzVtEp2luDTbTtDO4bWJoqQi0zQ1oIp4tEfoG7Ur4E1mEreychFIgE36PlQVtL9bwGl28myPd9nlER9mzdGv8FGwall41zQ2qvrVcXHt4o-oD620UJr2f3toGu1T1g0w25Fn2YMiIkHK"
      }
    ]
  },
  menuSection: {
    categoryTitle: "STARTERS & GRILL",
    items: [
      {
        name: "Hara Bhara Kebab",
        description: "Spinach, green peas & aromatic spices",
        price: 249,
        isVeg: true
      },
      {
        name: "Paneer Tikka",
        description: "Char-grilled cottage cheese with bell peppers",
        price: 349,
        isVeg: true
      },
      {
        name: "Chicken Tikka Tandoori",
        description: "Clay oven roasted marinated chicken chunks",
        price: 399,
        isVeg: false
      },
      {
        name: "Crusted Fish Finger",
        description: "Golden fried sea fish served with tartar",
        price: 399,
        isVeg: false
      },
      {
        name: "Crispy Chicken Wings",
        description: "Smoked chili glaze & garlic ranch dip",
        price: 369,
        isVeg: false
      }
    ],
    menuPagesText: "View full menu (7 pages)",
    totalPagesCount: 7,
    menuImages: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80"
    ]
  },
  photoMosaic: {
    primaryPhoto:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqzWP_s7LYFCtMBMRVsyBJtuTpVgBgKc8rSbvIMpkTchhreeML5w0zpTdSm9YQYsdfSw5-7GB-s0Qnz_vrRXmXPOTBsdT24Jt3T4jGwwzwzVtEp2luDTbTtDO4bWJoqQi0zQ1oIp4tEfoG7Ur4E1mEreychFIgE36PlQVtL9bwGl28myPd9nlER9mzdGv8FGwall41zQ2qvrVcXHt4o-oD620UJr2f3toGu1T1g0w25Fn2YMiIkHK",
    secondaryPhotos: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBR_CflBHpsyUsnU4_FVtj3ElQiklZejKLne2z2J_nOeL3hDY8MFWW1d8wdRDt5PUG-n0ogEvFp6ZRLhX7qproqpPxSBGpVXfQjjfu3I1mpHBhDPtXPVcsaT_UrSa45nNXRnCeMoDJGwluhfYLdJV7rwy_s2a8-vJBlmIQP9mWeHwJYeoLvReh88mfIqHRnxczb7FQCxJ0YKRjIoI2oOsdfO8nEEvGNnSf05Z4P22NtQzRsXo0rRS5u",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDBGOjFiQrZo3yQ2E05SAlyhyVw8aVxyTmnp1-QQEaa_XJ8wdl-rnuKbp3wywjVt16MWex1JI5tB2wfe91mvccSkVAo76-E6aUfQm0Z2bvrxwKk8VcLWN4VZ2XGRxxBK4_ZPPRyeeeWpRUYfADb_eXXLcWIEpH8cluV8yw_51gEHslm0lNV7wUmGnFz6jg7MMMVst0BTTb4aWo-fR6JNdd2EXm7bEaTvAb1BULNxQNbTUhIlbl5a1mW"
    ],
    additionalCountText: "+14 Photos",
    totalPhotosCount: 19,
    allPhotos: []
  },
  amenities: [
    { label: "Full Bar & Cocktails", icon: "martini-glass" },
    { label: "Valet Parking", icon: "square-parking" },
    { label: "Table Reservation", icon: "calendar-check" },
    { label: "PINAK UPI Instant Pay", icon: "qrcode" },
    { label: "Free Wi-Fi", icon: "wifi" },
    { label: "Air Conditioned", icon: "fan" },
    { label: "Live Music", icon: "music" },
    { label: "Sanitized Dining", icon: "shield-check" }
  ],
  locationSection: {
    addressLine1: "123, 100 Feet Road, Indiranagar",
    addressLine2: "Bengaluru, Karnataka 560038",
    fullAddress: "123, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
    distanceText: "4.6 km away",
    distanceMeters: 4600,
    mapPreviewImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEW8xr-QR-9fD_C9g34dirXBDrIaqXfPK9Dnz8_TGy2j1TxkOIWRJtbX-PhSDJpiVixDmXRUzaBr1XdiLhMOnfkE_vpZcQr2OmTnSz9uENzByT1VMgk3rcfpgqrGfux0QQS4G6DMRvJs99nRVBWQ_sxAkCOGvVOedqzTz4diJ0-CNbhcLQy8ScMK-yzV03K7ufSp5qKDXP8w3f5O5FBVr-GH0Tc4LyNh9fE-zysWBwjdizo6w-OkzW",
    latitude: 12.9715987,
    longitude: 77.6411543,
    googleMapsUrl: "https://maps.google.com/?q=12.9715987,77.6411543"
  },
  concierge: {
    title: "Have queries or need help booking?",
    subtitle: "24/7 PINAK Concierge Support",
    phone: "+918000000000",
    actionType: "CALL"
  },
  similarPlaces: [
    {
      id: "similar-1",
      name: "Tipsy Turk - Rooftop",
      rating: 4.3,
      distanceLocalityCuisine: "7 km, Sadar • North Indian",
      offerBadge: "Flat 40% off",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAw6mSHwP4LnlIhXt8vY9JQ-NfitEFitOAvif1SHIyetr0uzhy1abtySQobVLyUhajEEt0ph4wsY3occIOEZl4Nan_AWUC8eEck396xqQZ0cv_vAgz0_Xfld9ql79yyC37HWqOI0JuUEqXMknoFBVHH_1QaS2NwGc9pAWbAXNwDBXwcwuYtZNAah5TbuuyGTionRd1AEyeJNAIzZ5UPk05FmhKcpxC-Rt1XmEdqA-o5WmkH-qobFr3k"
    },
    {
      id: "similar-2",
      name: "Bellavista Skybar",
      rating: 4.2,
      distanceLocalityCuisine: "6 km, Civil Lines • Chinese",
      offerBadge: "Flat 15% off",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAHqUejXEtLYesDmlbAY3Rty2qIRRSAzRdcnuS6xJZbTZ_u2DzZwcqo5I5JXxU67cZtS84rLoDLFFyGG5B3hHjLRdCEozpP2FEDJ9brjS9ktghrPk1YBcc_KgbD9cgZT5kh9IomAG7J9yA8tD2gKH8vDvir6hkqPmMroFOgsWVu2T77ZWp71my2prU-iz1hmv9CAXpkFrdf60Hun6pH5AwaujxynLeXrsPozssUTOcvhu4-kDKuzPuB"
    }
  ],
  bottomBar: {
    rewardTeaser: {
      icon: "🪙",
      text: "Earn 20% PINAK Coins on bill payment",
      badge: "MAX REWARD"
    },
    isTableBookingEnabled: true,
    primaryAction: {
      type: "PAY_BILL",
      label: "Pay Bill Now",
      discountBadge: "50% OFF",
      enabled: true
    },
    secondaryAction: {
      type: "BOOK_TABLE",
      label: "Book a Table",
      enabled: true
    }
  }
};

interface ServiceDetailPreviewViewProps {
  storeId?: string;
  onBack: () => void;
}

export const ServiceDetailPreviewView: React.FC<ServiceDetailPreviewViewProps> = ({
  storeId = "e1000000-0000-0000-0000-000000000001",
  onBack
}) => {
  const [data, setData] = useState<ServiceDetailData>(canonicalSmokehouseGrillData);
  const [loading, setLoading] = useState(false);
  const [offerSegment, setOfferSegment] = useState<"PRE_BOOK" | "WALK_IN">("PRE_BOOK");
  const [activeTab, setActiveTab] = useState("Offers");
  const [isFavorited, setIsFavorited] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [selectedImageZoom, setSelectedImageZoom] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!storeId) return;
      try {
        setLoading(true);
        const res = await apiClient.get<any>(`/mobile/stores/${storeId}/detail?lat=12.9716&lng=77.6412`);
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load store detail from backend API, using canonical Screen 11 data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [storeId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data.storeName,
        text: `Check out ${data.storeName} on PINAK! Get ${data.priceForTwoText} with 50% OFF.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDirections = () => {
    window.open(data.googleMapsUrl || `https://maps.google.com/?q=${data.latitude},${data.longitude}`, "_blank");
  };

  const handleCall = () => {
    if (data.phone) {
      window.location.href = `tel:${data.phone}`;
    } else {
      toast.info("Concierge Support is dialing +918000000000");
    }
  };

  const handleClaimDeal = (dealTitle: string) => {
    toast.success(`Deal Added: "${dealTitle}"`, {
      description: "Added to your checkout bill pass with instant discount."
    });
  };

  const displayedOffers =
    offerSegment === "PRE_BOOK"
      ? data.offersSection?.preBookingOffers || []
      : data.offersSection?.walkInOffers || [];

  return (
    <div className="w-full bg-slate-50 text-slate-900 font-sans pb-28 relative">
      {/* ========================================================= */}
      {/* 1. HERO CAROUSEL & OVERLAY ACTIONS */}
      {/* ========================================================= */}
      <section className="relative bg-white pb-4 border-b border-slate-200" data-purpose="restaurant-hero-overview">
        <div className="relative w-full h-64 bg-slate-900 overflow-hidden">
          <img
            alt={data.storeName}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            src={data.coverImageUrl || data.heroPhotos?.[0]}
            onClick={() => setSelectedImageZoom(data.coverImageUrl || data.heroPhotos?.[0])}
          />
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
          <button
            onClick={() => data.heroPhotos?.length && setSelectedImageZoom(data.heroPhotos[0])}
            className="absolute bottom-9 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1.5 border border-white/20 cursor-pointer hover:bg-black/90"
          >
            <ImageIcon size={12} />
            <span>{data.photoCounterText || `1/${data.totalPhotosCount || 19}`}</span>
          </button>
        </div>

        {/* 2. OVERLAID INCENTIVE BANNER */}
        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-emerald-50 border border-emerald-300/90 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center border border-amber-500/40 shadow-xs">
                2X
              </span>
              <span className="text-xs font-bold text-slate-900">
                {data.coinPerkBanner?.title || "Earn & Redeem 2X PINAK Coins"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded">
              {data.coinPerkBanner?.badgeText || "AUTO-APPLY"}
            </span>
          </div>
        </div>

        {/* 3. RESTAURANT IDENTITY DETAILS */}
        <div className="px-4 mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {data.storeName}
                </h1>
                {data.isVerified && (
                  <CheckCircle2 size={16} className="text-purple-600 fill-purple-600 text-white shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <span className="font-medium">{data.distanceText}</span>
                <ChevronRight size={12} className="text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{data.cuisineAndPriceText}</p>
            </div>

            {/* Rating Box */}
            <div className="bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-center shrink-0 shadow-xs">
              <div className="flex items-center justify-center gap-1 font-bold text-sm leading-none">
                <span>{data.rating?.toFixed(1) || "4.8"}</span>
                <Star size={11} className="fill-white text-white" />
              </div>
              <div className="text-[8px] font-semibold tracking-tight text-white/95 mt-1 leading-none">
                {data.ratingCountText || "1.2K ratings"}
              </div>
            </div>
          </div>

          {/* Quick Status Pill & Action Buttons */}
          <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>{data.openStatusText || "Open till 12:30 AM"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirections}
                aria-label="Directions"
                className="h-8 px-2.5 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1.5 hover:bg-slate-200 active:scale-95 transition text-xs font-semibold cursor-pointer"
                type="button"
              >
                <Compass size={14} className="text-purple-700" />
                <span>Directions</span>
              </button>
              <button
                onClick={handleCall}
                aria-label="Call restaurant"
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                type="button"
              >
                <Phone size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. STICKY HORIZONTAL NAVIGATION TABS */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-y border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
        {(data.availableTabs || ["Offers", "Menu", "Photos", "Amenities", "Reviews", "Similar Places"]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              activeTab === tab
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 5. OFFERS & SAVINGS SECTION WITH SEGMENTED TOGGLE */}
      {/* ========================================================= */}
      <section className="px-4 pt-3 space-y-3" data-purpose="offers-for-you">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Offers & Savings</h2>
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            {data.offersSection?.activeOffersCountText || "4 Available"}
          </span>
        </div>

        {/* Segmented Toggle */}
        <div className="bg-slate-200/80 p-0.5 rounded-lg flex items-center">
          <button
            type="button"
            onClick={() => setOfferSegment("PRE_BOOK")}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
              offerSegment === "PRE_BOOK"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            Pre-booking offers
          </button>
          <button
            type="button"
            onClick={() => setOfferSegment("WALK_IN")}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
              offerSegment === "WALK_IN"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900 font-semibold"
            }`}
          >
            Walk-in offers
          </button>
        </div>

        {/* Hero Deal Card with Voucher Border */}
        <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-wide border border-purple-200">
                PINAK Exclusive
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wide border border-amber-200">
                Special Deal
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <Bolt size={12} className="fill-emerald-700" />
              <span>Instant</span>
            </span>
          </div>

          <h3
            onClick={() => toast.info("Voucher Terms: Flat 50% off on food & beverage bill capped at ₹500.")}
            className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center justify-between cursor-pointer group"
          >
            <span>{data.offersSection?.primaryOffer?.title || "Flat 50% off on Total Bill"}</span>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-700 transition" />
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {data.offersSection?.primaryOffer?.description || "Available on Mon-Sun • Valid on minimum bill ₹1,000"}
          </p>

          <div className="dashed-divider h-[1px] w-full my-3 border-b border-dashed border-slate-300"></div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {data.offersSection?.primaryOffer?.termsNote || "Auto-applied at checkout"}
            </span>
            <button
              onClick={() => toast.info("Valid on all dining visits. Cannot be combined with other store promotions.")}
              className="text-purple-700 font-bold text-xs hover:underline cursor-pointer"
              type="button"
            >
              View T&C
            </button>
          </div>
        </div>

        {/* Additional Segmented Offers List */}
        {displayedOffers.length > 1 && (
          <div className="space-y-2 pt-1">
            {displayedOffers.slice(1).map((off: any, idx: number) => (
              <div
                key={off.id || idx}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {offerSegment === "PRE_BOOK" ? "📅 Pre-Booking Only" : "🚶 Walk-In Deal"}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 flex items-center gap-0.5">
                      <Bolt size={10} /> Instant
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{off.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{off.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClaimDeal(off.title)}
                  className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold shrink-0 border border-purple-200 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dual Bank / Incentive Chips */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center gap-2 shadow-xs">
            <div className="w-7 h-7 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px] flex items-center justify-center shrink-0">
              20%
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">20% Cashback</p>
              <p className="text-[10px] text-slate-500 truncate">in PINAK Coins</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex items-center gap-2 shadow-xs">
            <div className="w-7 h-7 rounded bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
              <CreditCard size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">Flat 10% off</p>
              <p className="text-[10px] text-slate-500 truncate">HDFC / ICICI cards</p>
            </div>
          </div>
        </div>

        {/* Green Highlight Banner */}
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
              <Check size={12} className="stroke-[3]" />
            </span>
            <span>{data.offersSection?.greenPerkHighlight || "Earn 2X Coins on all table bookings & instant UPI pay"}</span>
          </div>
          <Info size={14} className="text-emerald-700 cursor-pointer shrink-0" />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FLASH SALE DEALS SECTION */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 space-y-2.5" data-purpose="flash-sale-deals">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Flash Sale Deals</h2>
            <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
              LIMITED
            </span>
          </div>
          <span
            onClick={() => toast.info("Showing all live flash sale combos for The Smokehouse Grill")}
            className="text-xs font-bold text-purple-700 cursor-pointer"
          >
            View all (3)
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {(data.flashSales?.deals || []).map((deal: any, idx: number) => (
            <div
              key={deal.id || idx}
              className="w-48 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="h-28 relative bg-slate-100">
                  <img
                    alt={deal.title}
                    className="w-full h-full object-cover"
                    src={deal.imageUrl}
                    onClick={() => setSelectedImageZoom(deal.imageUrl)}
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                    {deal.discountBadge || "30% OFF"}
                  </div>
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
                  Add Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. MENU HIGHLIGHTS SECTION */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 space-y-2.5" data-purpose="restaurant-menu">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
              <Utensils size={13} />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Menu Highlights</h2>
          </div>
          <span
            onClick={() => setShowMenuModal(true)}
            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
          >
            Explore All
          </span>
        </div>

        {/* Menu Card with Dietary Badges */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-700 tracking-wider uppercase">
              {data.menuSection?.categoryTitle || "STARTERS & GRILL"}
            </span>
            <span className="text-[11px] font-bold text-slate-400">PRICE</span>
          </div>

          {(data.menuSection?.items || []).map((dish: any, idx: number) => (
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
                  <p className="text-xs font-bold text-slate-900">{dish.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{dish.description}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-slate-900">₹{dish.price}</span>
            </div>
          ))}

          <button
            onClick={() => setShowMenuModal(true)}
            className="w-full mt-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            type="button"
          >
            <BookOpen size={13} className="text-purple-700" />
            <span>{data.menuSection?.menuPagesText || "View full menu (7 pages)"}</span>
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. PHOTOS MOSAIC SECTION */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 space-y-2.5" data-purpose="restaurant-photos">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Photos & Ambiance</h2>
          <span
            onClick={() => {
              if (data.heroPhotos?.length) setSelectedImageZoom(data.heroPhotos[0]);
            }}
            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
          >
            View all ({data.totalPhotosCount || 19})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div
            className="h-44 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
            onClick={() => setSelectedImageZoom(data.photoMosaic?.primaryPhoto)}
          >
            <img
              alt="Bar Area Ambiance"
              className="w-full h-full object-cover hover:scale-105 transition duration-300"
              src={data.photoMosaic?.primaryPhoto}
            />
          </div>
          <div className="space-y-2">
            <div
              className="h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
              onClick={() => setSelectedImageZoom(data.photoMosaic?.secondaryPhotos?.[0])}
            >
              <img
                alt="Dining Space"
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
                src={data.photoMosaic?.secondaryPhotos?.[0]}
              />
            </div>
            <div
              className="h-20 rounded-xl overflow-hidden border border-slate-200 relative group cursor-pointer"
              onClick={() => setSelectedImageZoom(data.photoMosaic?.secondaryPhotos?.[1])}
            >
              <img
                alt="Cocktail counter"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                src={data.photoMosaic?.secondaryPhotos?.[1]}
              />
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center text-white font-extrabold text-sm">
                {data.photoMosaic?.additionalCountText || "+14 Photos"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. VERIFIED AMENITIES SECTION */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 space-y-2.5" data-purpose="amenities">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Verified Amenities</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs">
          <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Wine size={13} />
              </span>
              <span>Full Bar & Cocktails</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Car size={13} />
              </span>
              <span>Valet Parking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <CalendarCheck size={13} />
              </span>
              <span>Table Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <QrCode size={13} />
              </span>
              <span>PINAK UPI Instant Pay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Wifi size={13} />
              </span>
              <span>Free Wi-Fi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Fan size={13} />
              </span>
              <span>Air Conditioned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <Music size={13} />
              </span>
              <span>Live Music</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-purple-50 text-purple-700 flex items-center justify-center text-xs">
                <ShieldCheck size={13} />
              </span>
              <span>Sanitized Dining</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. LOCATION & MAP SECTION */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 space-y-2.5" data-purpose="location">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Location</h2>
          <span onClick={handleDirections} className="text-xs font-bold text-purple-700 cursor-pointer">
            {data.locationSection?.distanceText || "4.6 km away"}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="relative h-32 w-full bg-slate-100 cursor-pointer" onClick={handleDirections}>
            <img
              alt="Map Location Preview"
              className="w-full h-full object-cover"
              src={data.locationSection?.mapPreviewImageUrl}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin size={16} />
              </div>
            </div>
          </div>
          <div className="p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                {data.locationSection?.addressLine1 || "123, 100 Feet Road, Indiranagar"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {data.locationSection?.addressLine2 || "Bengaluru, Karnataka 560038"}
              </p>
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
      {/* 11. 24/7 CONCIERGE HELP & SUPPORT */}
      {/* ========================================================= */}
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
                {data.concierge?.subtitle || "24/7 PINAK Concierge Support"}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 12. SIMILAR PLACES NEAR YOU */}
      {/* ========================================================= */}
      <section className="px-4 pt-4 pb-4 space-y-3" data-purpose="recommended-options">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Similar Places Near You</h2>
          <ChevronRight size={14} className="text-purple-700 cursor-pointer" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {(data.similarPlaces || []).map((spot: any) => (
            <div
              key={spot.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs cursor-pointer group"
              onClick={() => toast.info(`Viewing ${spot.name}`)}
            >
              <div className="h-28 relative bg-slate-100">
                <img alt={spot.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" src={spot.imageUrl} />
                <div className="absolute bottom-2 right-2 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                  <span>{spot.rating}</span>
                  <Star size={8} className="fill-white text-white" />
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-slate-900 truncate">{spot.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{spot.distanceLocalityCuisine}</p>
                <div className="mt-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                  {spot.offerBadge}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 13. PERSISTENT BOTTOM ACTION BAR */}
      {/* ========================================================= */}
      <footer className="sticky bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md rounded-t-2xl border-t border-slate-200 shadow-2xl p-3">
        {/* Incentive Teaser */}
        <div className="mb-2 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center">
              🪙
            </span>
            <span className="text-[11px] font-bold text-slate-800">
              {data.bottomBar?.rewardTeaser?.text || "Earn 20% PINAK Coins on bill payment"}
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-800 uppercase">
            {data.bottomBar?.rewardTeaser?.badge || "MAX REWARD"}
          </span>
        </div>

        {/* High-Impact Dual CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() =>
              toast.success("Table Booking Opened", {
                description: "Selecting guests & reservation time for The Smokehouse Grill"
              })
            }
            className="flex-1 py-2.5 px-3 rounded-xl border-2 border-purple-700 text-purple-700 hover:bg-purple-50 font-bold active:scale-98 transition text-xs text-center cursor-pointer"
            type="button"
          >
            {data.bottomBar?.secondaryAction?.label || "Book a Table"}
          </button>
          <button
            onClick={() =>
              toast.success("PINAK Pay Bill Pass Initiated", {
                description: "Auto-applying Flat 50% discount voucher on your total dine-in bill!"
              })
            }
            className="flex-1 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold active:scale-98 transition text-xs shadow-md shadow-purple-900/20 text-center flex items-center justify-center gap-1.5 cursor-pointer"
            type="button"
          >
            <span>{data.bottomBar?.primaryAction?.label || "Pay Bill Now"}</span>
            {data.bottomBar?.primaryAction?.discountBadge && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {data.bottomBar?.primaryAction?.discountBadge}
              </span>
            )}
          </button>
        </div>
      </footer>

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
                  {data.menuSection?.menuImages?.length || 7} scanned pages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
              className="absolute -top-10 right-0 text-white p-1 hover:text-slate-300"
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
