import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldCheck,
  Store,
  TicketPercent,
  Percent,
  Info,
  Share2,
  MessageSquare,
  Phone,
  User,
  MapPin,
  CalendarClock,
  Smartphone,
  ArrowRight,
  X,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/api/client";
import tableBookingApi, { TableBookingAvailabilityData, TableBookingDetails } from "@/api/tableBookingApi";
import PayBillView from "./PayBillView";
import { useAppStore } from "@/hooks/useAppStore";

export interface BookingOptionItem {
  id: string;
  title: string;
  subtitle?: string;
  discountPct?: number;
  coverChargePerGuest: number;
  isExclusive?: boolean;
  isRegular?: boolean;
  perkHighlight?: string;
  terms?: string;
  minPartySize?: number;
  maxPartySize?: number;
  slotTimes?: string[] | string;
  activeDays?: string[] | string;
}

export interface TableBookingViewProps {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  storeCuisines?: string;
  storePhone?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  userLat?: number;
  userLng?: number;
  openingTime?: string;
  closingTime?: string;
  coinPerkBanner?: {
    multiplier?: string;
    title: string;
    tag?: string;
    badgeText?: string;
  };
  cashbackPercentage?: number;
  preBookingOffers?: any[];
  primaryOffer?: any;
  initialBookingStep?: "select_slot" | "checkout_bill" | "confirmed";
  initialBookingRef?: string;
  initialBookingDetails?: TableBookingDetails | null;
  initialGuests?: number;
  initialSlot?: string;
  initialOfferId?: string;
  initialOfferTitle?: string;
  initialOfferDiscount?: number;
  initialCoverCharge?: number;
  initialOfferTerms?: string | string[];
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  customerId?: string;
  customerCoins?: number;
  contactPhone?: string;
  storeData?: any;
  onBack: () => void;
  onPayBill?: () => void;
  onBookingConfirmed?: (bookingDetails: any) => void;
  onViewStoreDetails?: (storeId?: string) => void;
}

function parseTermsAndConditions(
  rawTerms?: string | string[] | null,
  fallbackArray?: string[] | null
): string[] {
  if (Array.isArray(rawTerms) && rawTerms.length > 0) {
    return rawTerms
      .map((t) => String(t).replace(/^[ \-\*•\d+\.]\s*/, "").trim())
      .filter(Boolean);
  }
  if (typeof rawTerms === "string" && rawTerms.trim().length > 0) {
    const trimmed = rawTerms.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map((t: any) => String(t).replace(/^[ \-\*•\d+\.]\s*/, "").trim())
            .filter(Boolean);
        }
      } catch (e) {
        // Not valid JSON
      }
    }
    const lines = trimmed.includes("\n")
      ? trimmed.split("\n")
      : trimmed.includes("•")
      ? trimmed.split("•")
      : [trimmed];

    const result = lines
      .map((line) => line.replace(/^[ \-\*•\d+\.]\s*/, "").trim())
      .filter((line) => line.length > 0);

    if (result.length > 0) return result;
  }
  if (Array.isArray(fallbackArray) && fallbackArray.length > 0) {
    return fallbackArray
      .map((t) => String(t).replace(/^[ \-\*•\d+\.]\s*/, "").trim())
      .filter(Boolean);
  }
  return [
    "Valid for dine-in reservations made via PINAK SuperApp only.",
    "Flat discount applies on the total food and soft beverage bill before taxes.",
    "The table reservation will be held for up to 15 minutes past the scheduled slot time; please arrive on time.",
    "Cannot be clubbed or combined with any other in-store promotions, happy hours, or special buffet rates.",
    "The full discount is redeemed automatically when settling the final dining bill through the PINAK app/QR.",
    "Cover charges (if applicable) are 100% refundable if the booking is cancelled at least 2 hours prior to the slot time.",
    "Right of admission is reserved by restaurant management. Valid government photo ID may be requested upon arrival."
  ];
}

export const TableBookingView: React.FC<TableBookingViewProps> = ({
  storeId,
  storeName,
  storeAddress,
  storeCuisines,
  storePhone,
  contactPhone,
  googleMapsUrl,
  latitude,
  longitude,
  userLat,
  userLng,
  openingTime,
  closingTime,
  coinPerkBanner,
  cashbackPercentage,
  preBookingOffers,
  primaryOffer,
  initialBookingStep,
  initialBookingRef,
  initialBookingDetails,
  initialGuests = 2,
  initialSlot,
  initialOfferId,
  initialOfferTitle,
  initialOfferDiscount,
  initialCoverCharge,
  initialOfferTerms,
  initialCustomerName,
  initialCustomerPhone,
  customerId,
  customerCoins,
  storeData,
  onBack,
  onPayBill,
  onBookingConfirmed,
  onViewStoreDetails
}) => {
  const appStore = useAppStore();
  const [guestName, setGuestName] = useState<string>(() => {
    return initialCustomerName || appStore.currentUser?.name || "";
  });
  const [guestPhone, setGuestPhone] = useState<string>(() => {
    return initialCustomerPhone || appStore.currentUser?.phone || "";
  });

  useEffect(() => {
    if (!guestName && appStore.currentUser?.name) {
      setGuestName(appStore.currentUser.name);
    }
    if (!guestPhone && appStore.currentUser?.phone) {
      setGuestPhone(appStore.currentUser.phone);
    }
  }, [appStore.currentUser]);

  // If storeData or offers are not passed directly, fetch from backend via storeId
  const [fetchedData, setFetchedData] = useState<any>(storeData || null);
  const [availabilityData, setAvailabilityData] = useState<TableBookingAvailabilityData | null>(null);
  const [showPayBillView, setShowPayBillView] = useState<boolean>(false);
  const [deviceCoords, setDeviceCoords] = useState<{ lat?: number; lng?: number }>({
    lat: userLat,
    lng: userLng
  });

  useEffect(() => {
    if (userLat != null && userLng != null) {
      setDeviceCoords({ lat: userLat, lng: userLng });
    } else if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [userLat, userLng]);

  const effectiveUserLat = deviceCoords.lat ?? userLat;
  const effectiveUserLng = deviceCoords.lng ?? userLng;

  const [loading, setLoading] = useState<boolean>(
    !storeData && !!storeId && (!preBookingOffers || preBookingOffers.length === 0)
  );

  useEffect(() => {
    if (storeId) {
      let active = true;
      tableBookingApi
        .getAvailability(storeId, effectiveUserLat, effectiveUserLng)
        .then((avail) => {
          if (active && avail) {
            setAvailabilityData(avail);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch table booking availability from backend:", err);
        });
      return () => {
        active = false;
      };
    }
  }, [storeId, effectiveUserLat, effectiveUserLng]);

  useEffect(() => {
    if (!fetchedData && storeId && (!preBookingOffers || preBookingOffers.length === 0)) {
      let active = true;
      setLoading(true);
      apiClient
        .get<any>(`/mobile/stores/${storeId}/detail`, {
          params: {
            lat: effectiveUserLat,
            lng: effectiveUserLng,
            latitude: effectiveUserLat,
            longitude: effectiveUserLng
          }
        })
        .then((res) => {
          if (active && res.data?.success && res.data?.data) {
            setFetchedData(res.data.data);
          }
        })
        .catch((err) => {
          console.warn("Could not load backend store detail for table booking:", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }
  }, [storeId, storeData, preBookingOffers, effectiveUserLat, effectiveUserLng]);

  // Fallbacks resolving from backend response or props
  const effectiveStoreName =
    initialBookingDetails?.storeName ||
    storeName ||
    fetchedData?.storeName ||
    "Restaurant Partner";
  const effectiveAddress =
    initialBookingDetails?.storeAddress ||
    storeAddress ||
    fetchedData?.address ||
    fetchedData?.locationSection?.fullAddress ||
    "Nagpur";
  const effectiveCuisines =
    storeCuisines || fetchedData?.cuisines || "Dining & Treats";
  const effectivePhone =
    contactPhone ||
    storePhone ||
    initialBookingDetails?.contactPhone ||
    fetchedData?.phone ||
    fetchedData?.concierge?.phone ||
    "";
  const effectiveLat = latitude || fetchedData?.latitude;
  const effectiveLng = longitude || fetchedData?.longitude;
  const effectiveMapsUrl =
    googleMapsUrl ||
    fetchedData?.googleMapsUrl ||
    (effectiveLat && effectiveLng
      ? `https://maps.google.com/?q=${effectiveLat},${effectiveLng}`
      : `https://maps.google.com/?q=${encodeURIComponent(
          effectiveStoreName + " " + effectiveAddress
        )}`);
  const effectiveOpening =
    openingTime || fetchedData?.openingTime || "11:00";
  const effectiveClosing =
    closingTime || fetchedData?.closingTime || "23:00";
  const effectiveCoinBanner =
    coinPerkBanner ||
    fetchedData?.coinPerkBanner ||
    fetchedData?.coinsPerkBanner;
  const effectiveCashbackText =
    effectiveCoinBanner?.title ||
    (cashbackPercentage
      ? `Earn ${cashbackPercentage}% PINAK Cashback Coins`
      : "Earn 20% PINAK Coins on bill payment");

  // Offers from backend
  const resolvedOffers = useMemo(() => {
    if (preBookingOffers && preBookingOffers.length > 0) return preBookingOffers;
    if (
      fetchedData?.offersSection?.preBookingOffers &&
      fetchedData.offersSection.preBookingOffers.length > 0
    ) {
      return fetchedData.offersSection.preBookingOffers;
    }
    if (primaryOffer) return [primaryOffer];
    if (fetchedData?.offersSection?.primaryOffer) {
      return [fetchedData.offersSection.primaryOffer];
    }
    return [];
  }, [preBookingOffers, fetchedData, primaryOffer]);

  // Exclusive Pre-booking Options dynamically constructed from backend offers
  const exclusiveOptions = useMemo<BookingOptionItem[]>(() => {
    if (resolvedOffers.length > 0) {
      return resolvedOffers.map((o: any, idx: number) => {
        const discount =
          o.discountValue != null
            ? Number(o.discountValue)
            : (o.value != null ? Number(o.value) : (initialOfferDiscount || 20));
        const cover =
          o.coverChargeAmount != null ? Number(o.coverChargeAmount) : 0;
        return {
          id: o.id || `opt_${idx}`,
          title: o.title || `Flat ${discount}% off on Total Bill`,
          subtitle: o.subtitle || o.description,
          discountPct: discount,
          coverChargePerGuest: cover,
          isExclusive: true,
          terms: o.termsAndConditions,
          minPartySize:
            o.minPartySize != null ? Number(o.minPartySize) : undefined,
          maxPartySize:
            o.maxPartySize != null ? Number(o.maxPartySize) : undefined,
          slotTimes: o.slotTimes,
          seatingAreas: o.seatingAreas,
          activeDays: o.activeDays,
          perkHighlight: o.bonusCoins
            ? `+${o.bonusCoins} Bonus Coins on visit`
            : "Redeem it by paying final bill via PINAK"
        };
      });
    }

    if (availabilityData?.exclusiveOffers && availabilityData.exclusiveOffers.length > 0) {
      return availabilityData.exclusiveOffers.map((o) => ({
        id: o.id,
        title: o.title,
        discountPct: Number(o.discountPct || 0),
        coverChargePerGuest: Number(o.coverChargePerGuest || 0),
        isExclusive: true,
        terms: o.termsAndConditions,
        minPartySize: o.minPartySize,
        maxPartySize: o.maxPartySize,
        slotTimes: o.slotTimes,
        seatingAreas: o.seatingAreas,
        perkHighlight: o.perkHighlight || "Redeem it by paying final bill via PINAK"
      }));
    }

    // Default fallback offer if store offers are still empty
    const primaryTitle = initialOfferTitle || "Flat 20% off on Total Bill";
    return [
      {
        id: "opt_primary",
        title: primaryTitle,
        discountPct: initialOfferDiscount || 20,
        coverChargePerGuest:
          initialCoverCharge != null ? Number(initialCoverCharge) : 0,
        isExclusive: true,
        terms: typeof initialOfferTerms === "string" ? initialOfferTerms : initialOfferTerms?.[0],
        perkHighlight: "Redeem it by paying final bill via PINAK"
      }
    ];
  }, [resolvedOffers, availabilityData?.exclusiveOffers, initialOfferTitle, initialOfferDiscount, initialCoverCharge, initialOfferTerms]);

  const regularOption: BookingOptionItem | null = useMemo(() => {
    if (availabilityData) {
      if (!availabilityData.regularOffer) {
        return null;
      }
      const charge = Number(availabilityData.regularOffer.coverChargePerGuest || 0);
      return {
        id: "opt_regular",
        title: availabilityData.regularOffer.title || "Standard table booking",
        coverChargePerGuest: charge,
        isRegular: true,
        perkHighlight: availabilityData.regularOffer.perkHighlight ||
          (charge > 0
            ? `Standard cover charge of ₹${charge} / guest (adjusted against final bill)`
            : "Zero cover charge • Instant reservation confirmation")
      };
    }
    const isFree = storeData?.allowFreeStandardBooking ?? true;
    const cover = isFree ? 0 : Number(storeData?.defaultStandardCoverCharge || 0);
    if (!isFree && cover <= 0) {
      return null;
    }
    return {
      id: "opt_regular",
      title: "Standard table booking",
      coverChargePerGuest: cover,
      isRegular: true,
      perkHighlight: cover > 0
        ? `Standard cover charge of ₹${cover} / guest (adjusted against final bill)`
        : "Zero cover charge • Instant reservation confirmation"
    };
  }, [availabilityData, storeData]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>(() => {
    if (initialOfferId && exclusiveOptions.some((o) => o.id === initialOfferId)) {
      return initialOfferId;
    }
    if (initialOfferTitle) {
      const match = exclusiveOptions.find((o) => o.title === initialOfferTitle);
      if (match) return match.id;
    }
    return exclusiveOptions[0]?.id || "opt_regular";
  });

  const activeOption = useMemo(() => {
    if (selectedOptionId === "opt_regular" && regularOption) return regularOption;
    return (
      exclusiveOptions.find((o) => o.id === selectedOptionId) ||
      exclusiveOptions[0] ||
      regularOption || {
        id: "opt_fallback",
        title: "Table Reservation",
        coverChargePerGuest: 0,
        perkHighlight: "Reservation confirmation"
      }
    );
  }, [selectedOptionId, exclusiveOptions, regularOption]);

  // Offer terms & conditions loaded dynamically from database
  const resolvedTermsList = useMemo<string[]>(() => {
    if (activeOption.terms && activeOption.terms.trim()) {
      return parseTermsAndConditions(activeOption.terms);
    }
    if (availabilityData?.termsAndConditions && availabilityData.termsAndConditions.length > 0) {
      return parseTermsAndConditions(availabilityData.termsAndConditions);
    }
    if (initialOfferTerms) {
      const termsStr = Array.isArray(initialOfferTerms) ? initialOfferTerms.join("\n") : initialOfferTerms;
      if (termsStr.trim()) {
        return parseTermsAndConditions(termsStr);
      }
    }
    const offerWithTerms = resolvedOffers.find(
      (o: any) => o.termsAndConditions && String(o.termsAndConditions).trim()
    );
    if (offerWithTerms) {
      return parseTermsAndConditions(offerWithTerms.termsAndConditions);
    }
    return parseTermsAndConditions(null);
  }, [activeOption.terms, availabilityData?.termsAndConditions, initialOfferTerms, resolvedOffers]);

  // Navigation Flow: "select_slot" -> "checkout_bill" -> "confirmed"
  type BookingStep = "select_slot" | "checkout_bill" | "confirmed";
  const [bookingStep, setBookingStep] = useState<BookingStep>(initialBookingStep || "select_slot");
  const [isCancelled, setIsCancelled] = useState<boolean>(initialBookingDetails?.status === "CANCELLED" || false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>(
    initialBookingRef || initialBookingDetails?.bookingRef || ""
  );
  const [bookingDetails, setBookingDetails] = useState<TableBookingDetails | null>(
    initialBookingDetails || null
  );

  useEffect(() => {
    if (initialBookingStep) {
      setBookingStep(initialBookingStep);
    }
  }, [initialBookingStep]);

  useEffect(() => {
    if (initialBookingDetails) {
      setBookingDetails(initialBookingDetails);
      if (initialBookingDetails.bookingRef) {
        setConfirmedBookingId(initialBookingDetails.bookingRef);
      }
      if (initialBookingDetails.status === "CANCELLED") {
        setIsCancelled(true);
      }
      if (initialBookingDetails.guests) {
        setSelectedGuests(initialBookingDetails.guests);
      }
      if (initialBookingDetails.slotTime) {
        setSelectedSlot(initialBookingDetails.slotTime);
      }
    }
  }, [initialBookingDetails]);

  // Poll / refresh live booking details from backend so when waiter/store user adds a bill,
  // the pay bill button enables in real-time without needing a manual page reload
  useEffect(() => {
    const targetRef = confirmedBookingId || initialBookingRef || initialBookingDetails?.bookingRef;
    if (!targetRef) return;

    let active = true;
    const refreshBooking = () => {
      tableBookingApi
        .getBookingDetails(targetRef)
        .then((latest) => {
          if (active && latest) {
            setBookingDetails((prev) => ({ ...(prev || {}), ...latest }));
          }
        })
        .catch((err) => {
          console.warn("Could not poll latest booking details:", err);
        });
    };

    refreshBooking();
    const interval = setInterval(refreshBooking, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [confirmedBookingId, initialBookingRef, initialBookingDetails?.bookingRef]);

  // Guest options derived from active offer minPartySize and maxPartySize, or availabilityData.guestConfig
  const guestOptions = useMemo(() => {
    if (availabilityData?.guestConfig?.availableGuestCounts && availabilityData.guestConfig.availableGuestCounts.length > 0) {
      return availabilityData.guestConfig.availableGuestCounts;
    }
    const min =
      activeOption.minPartySize && activeOption.minPartySize > 0
        ? activeOption.minPartySize
        : 1;
    const max =
      activeOption.maxPartySize && activeOption.maxPartySize >= min
        ? Math.min(activeOption.maxPartySize, 12)
        : 8;
    const list: number[] = [];
    for (let i = min; i <= max; i++) {
      list.push(i);
    }
    return list.length > 0 ? list : [1, 2, 3, 4, 5, 6, 7, 8];
  }, [activeOption.minPartySize, activeOption.maxPartySize, availabilityData?.guestConfig]);

  const [selectedGuests, setSelectedGuests] = useState<number>(() => {
    if (initialBookingDetails?.guests) {
      return initialBookingDetails.guests;
    }
    if (initialGuests && initialGuests >= (guestOptions[0] || 1)) {
      return initialGuests;
    }
    return guestOptions[0] || 2;
  });

  // Clamp selected guests when guest range changes
  useEffect(() => {
    if (bookingStep !== "confirmed" && guestOptions.length > 0) {
      const min = guestOptions[0];
      const max = guestOptions[guestOptions.length - 1];
      if (selectedGuests < min) setSelectedGuests(min);
      else if (selectedGuests > max) setSelectedGuests(max);
    }
  }, [guestOptions, selectedGuests, bookingStep]);

  // Upcoming 7 days with real discounts
  const upcomingDates = useMemo(() => {
    const discountText = activeOption.discountPct
      ? `${activeOption.discountPct}% off`
      : "Special";

    if (availabilityData?.upcomingDates && availabilityData.upcomingDates.length > 0) {
      return availabilityData.upcomingDates.map((item) => {
        const d = new Date(item.key);
        return {
          key: item.key,
          month: item.month,
          dayNum: item.dayNum,
          dayName: item.dayName,
          discount: item.discountBadge || discountText,
          isDayActive: item.isAvailable,
          fullDate: isNaN(d.getTime()) ? new Date() : d
        };
      });
    }

    const dates = [];
    const now = new Date();

    let activeDaysSet: Set<string> | null = null;
    if (activeOption.activeDays) {
      try {
        const parsed =
          typeof activeOption.activeDays === "string"
            ? JSON.parse(activeOption.activeDays)
            : activeOption.activeDays;
        if (Array.isArray(parsed)) {
          activeDaysSet = new Set(
            parsed.map((d: string) => d.toLowerCase().slice(0, 3))
          );
        }
      } catch {
        // ignore JSON parse error
      }
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const dayNum = String(d.getDate()).padStart(2, "0");
      const weekdayShort = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekdayShort;

      const isDayActive =
        !activeDaysSet ||
        activeDaysSet.has(weekdayShort.toLowerCase().slice(0, 3));
      const discount = isDayActive ? discountText : "Standard";

      dates.push({
        key: d.toISOString().split("T")[0],
        month,
        dayNum,
        dayName,
        discount,
        isDayActive,
        fullDate: d
      });
    }
    return dates;
  }, [activeOption.discountPct, activeOption.activeDays, availabilityData?.upcomingDates]);

  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const selectedDate = upcomingDates[selectedDateIndex] || upcomingDates[0];

  // Helper to parse 12-hour or 24-hour slot time strings to minutes from midnight for true chronological sorting
  const parseSlotMinutes = (slot: string): number => {
    if (!slot) return 0;
    const clean = slot.trim().toLowerCase();
    const isPM = clean.includes("pm");
    const isAM = clean.includes("am");
    const match = clean.match(/(\d+):(\d+)/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  };

  // Parse slot times from offer or backend store details
  const rawSlots = useMemo(() => {
    let slots: string[] = [];
    const targetSlotSource =
      activeOption.slotTimes ||
      fetchedData?.offersSection?.primaryOffer?.slotTimes;
    if (targetSlotSource) {
      try {
        const parsed =
          typeof targetSlotSource === "string"
            ? JSON.parse(targetSlotSource)
            : targetSlotSource;
        if (Array.isArray(parsed) && parsed.length > 0) {
          slots = parsed.map(String);
        }
      } catch {
        // failed parse
      }
    }
    return slots;
  }, [activeOption.slotTimes, fetchedData]);

  // Divide slots into lunch and dinner, strictly sorted chronologically
  const { lunchSlots, dinnerSlots } = useMemo(() => {
    const discountText = activeOption.discountPct
      ? `${activeOption.discountPct}% off`
      : "Special Deal";

    // 1. If active offer explicitly defines slotTimes, honor them strictly!
    if (rawSlots.length > 0) {
      const lunch: { time: string; discount: string }[] = [];
      const dinner: { time: string; discount: string }[] = [];

      const sortedRaw = [...rawSlots].sort((a, b) => parseSlotMinutes(a) - parseSlotMinutes(b));

      for (const slot of sortedRaw) {
        const mins = parseSlotMinutes(slot);
        if (mins < 17 * 60) {
          lunch.push({ time: slot, discount: discountText });
        } else {
          dinner.push({ time: slot, discount: discountText });
        }
      }
      return { lunchSlots: lunch, dinnerSlots: dinner };
    }

    // 2. If backend availability API returned dynamic slots from DB
    if ((availabilityData?.lunchSlots && availabilityData.lunchSlots.length > 0) ||
        (availabilityData?.dinnerSlots && availabilityData.dinnerSlots.length > 0)) {
      const lunch = (availabilityData.lunchSlots || []).map((s) => ({
        time: s.time,
        discount: s.discountBadge || discountText
      })).sort((a, b) => parseSlotMinutes(a.time) - parseSlotMinutes(b.time));

      const dinner = (availabilityData.dinnerSlots || []).map((s) => ({
        time: s.time,
        discount: s.discountBadge || discountText
      })).sort((a, b) => parseSlotMinutes(a.time) - parseSlotMinutes(b.time));

      return { lunchSlots: lunch, dinnerSlots: dinner };
    }

    // 3. Default time slots matching standard store hours
    const defaultLunch = [
      { time: "12:00 PM", discount: discountText },
      { time: "12:30 PM", discount: discountText },
      { time: "01:00 PM", discount: discountText },
      { time: "01:30 PM", discount: discountText },
      { time: "02:00 PM", discount: discountText },
      { time: "02:30 PM", discount: discountText },
      { time: "03:00 PM", discount: discountText }
    ];
    const defaultDinner = [
      { time: "07:00 PM", discount: discountText },
      { time: "07:30 PM", discount: discountText },
      { time: "08:00 PM", discount: discountText },
      { time: "08:30 PM", discount: discountText },
      { time: "09:00 PM", discount: discountText },
      { time: "09:30 PM", discount: discountText },
      { time: "10:00 PM", discount: discountText }
    ];
    return { lunchSlots: defaultLunch, dinnerSlots: defaultDinner };
  }, [rawSlots, activeOption.discountPct, availabilityData]);

  // Meal Type Toggle (Lunch / Dinner)
  const [mealType, setMealType] = useState<"LUNCH" | "DINNER">(() => {
    if (initialBookingDetails?.mealType) {
      return initialBookingDetails.mealType.toUpperCase() === "DINNER" ? "DINNER" : "LUNCH";
    }
    const slot = initialSlot || initialBookingDetails?.slotTime;
    if (slot && slot.toLowerCase().includes("pm") && parseInt(slot) >= 6 && parseInt(slot) !== 12) {
      return "DINNER";
    }
    if (lunchSlots.length === 0 && dinnerSlots.length > 0) return "DINNER";
    return "LUNCH";
  });

  // Keep meal type valid if available slots change
  useEffect(() => {
    if (bookingStep !== "confirmed") {
      if (mealType === "LUNCH" && lunchSlots.length === 0 && dinnerSlots.length > 0) {
        setMealType("DINNER");
      } else if (mealType === "DINNER" && dinnerSlots.length === 0 && lunchSlots.length > 0) {
        setMealType("LUNCH");
      }
    }
  }, [lunchSlots.length, dinnerSlots.length, mealType, bookingStep]);

  const currentSlots = mealType === "LUNCH" ? lunchSlots : dinnerSlots;
  const [selectedSlot, setSelectedSlot] = useState<string>(() => {
    if (initialBookingDetails?.slotTime) {
      return initialBookingDetails.slotTime;
    }
    if (
      initialSlot &&
      (lunchSlots.some((s) => s.time === initialSlot) ||
        dinnerSlots.some((s) => s.time === initialSlot))
    ) {
      return initialSlot;
    }
    return lunchSlots[0]?.time || dinnerSlots[0]?.time || "01:00 PM";
  });

  useEffect(() => {
    if (bookingStep !== "confirmed" && currentSlots.length > 0 && !currentSlots.some((s) => s.time === selectedSlot)) {
      setSelectedSlot(currentSlots[0].time);
    }
  }, [currentSlots, selectedSlot, bookingStep]);

  const [showAllSlots, setShowAllSlots] = useState<boolean>(false);

  // Total Cover Charge Calculation
  const totalCoverCharge = selectedGuests * (activeOption.coverChargePerGuest || 0);

  // Accordions
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(true);
  const [isCheckoutTermsOpen, setIsCheckoutTermsOpen] = useState<boolean>(false);
  const [isConfirmedTermsOpen, setIsConfirmedTermsOpen] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [includeVipPlan, setIncludeVipPlan] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Google Pay");

  const vipPlanFee = includeVipPlan ? 1 : 0;
  const totalToPay = totalCoverCharge + vipPlanFee;

  const handleProceedToCheckout = () => {
    setBookingStep("checkout_bill");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmPaymentAndBooking = async () => {
    const finalGuestName = guestName.trim() || appStore.currentUser?.name || "Guest";
    const finalGuestPhone = guestPhone.trim() || appStore.currentUser?.phone || "";
    if (!finalGuestPhone) {
      toast.error("Please enter your mobile phone number for table reservation.");
      return;
    }

    setIsSubmitting(true);
    const dateKey = selectedDate.key;
    const targetStoreId = storeId || "97aabe53-9349-439d-952e-40f723bb8f51";

    try {
      const resp = await tableBookingApi.createBooking({
        storeId: targetStoreId,
        bookingDate: dateKey,
        mealType: mealType,
        slotTime: selectedSlot,
        guests: selectedGuests,
        offerId: activeOption.id,
        offerTitle: activeOption.title,
        discountPct: activeOption.discountPct || 20,
        coverChargePerGuest: activeOption.coverChargePerGuest || 0,
        includeVipPlan: includeVipPlan,
        vipPlanFee: vipPlanFee,
        customerName: finalGuestName,
        customerPhone: finalGuestPhone,
        customerEmail: appStore.currentUser?.email || undefined,
        paymentMethod: selectedPaymentMethod,
        specialRequests: "Pre-book table via PINAK Mobile App"
      });

      setBookingDetails(resp);
      setConfirmedBookingId(resp.bookingRef);
      setIsCancelled(false);
      setBookingStep("confirmed");
      window.scrollTo({ top: 0, behavior: "smooth" });

      if (onBookingConfirmed) {
        onBookingConfirmed(resp);
      }
      toast.success(`Table confirmed at ${effectiveStoreName}!`, {
        description: `Reservation #${resp.bookingRef} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}`
      });
    } catch (err: any) {
      console.warn("Backend reservation call failed, falling back to instant local confirmation:", err);
      const fallbackRef = `PNK-TB-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedBookingId(fallbackRef);
      setIsCancelled(false);
      setBookingStep("confirmed");
      window.scrollTo({ top: 0, behavior: "smooth" });

      const details = {
        bookingRef: fallbackRef,
        storeId: targetStoreId,
        offerId: activeOption.id,
        storeName: effectiveStoreName,
        storeAddress: effectiveAddress,
        guests: selectedGuests,
        date: `${selectedDate.month} ${selectedDate.dayNum} (${selectedDate.dayName})`,
        time: selectedSlot,
        offerTitle: activeOption.title,
        discountPct: activeOption.discountPct,
        coverCharge: totalCoverCharge,
        amountPaid: totalToPay,
        paymentMethod: selectedPaymentMethod
      };

      if (onBookingConfirmed) {
        onBookingConfirmed(details);
      }
      toast.success(`Table confirmed at ${effectiveStoreName}!`, {
        description: `Reservation #${fallbackRef} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCancellation = async () => {
    setIsCancelling(true);
    try {
      if (confirmedBookingId) {
        const resp = await tableBookingApi.cancelBooking(confirmedBookingId, {
          cancellationReason: "Change of plans",
          comments: "Customer cancelled table reservation via mobile app"
        });
        setBookingDetails(resp);
      }
    } catch (err: any) {
      console.warn("Backend cancellation call failed, applying local cancellation:", err);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
      setIsCancelled(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.error("Table reservation cancelled", {
        description: `Full refund of ₹${bookingDetails?.refundAmount ?? totalCoverCharge} initiated to ${selectedPaymentMethod}.`
      });
    }
  };

  if (showPayBillView) {
    return (
      <PayBillView
        storeId={storeId}
        storeName={effectiveStoreName}
        storeAddress={effectiveAddress}
        coverImageUrl={storeData?.coverImageUrl || storeData?.heroPhotos?.[0] || fetchedData?.coverImageUrl || fetchedData?.heroPhotos?.[0]}
        distanceKm={storeData?.distanceMeters ? Number((storeData.distanceMeters / 1000).toFixed(1)) : (fetchedData?.distanceMeters ? Number((fetchedData.distanceMeters / 1000).toFixed(1)) : 88.1)}
        initialBillAmount={bookingDetails?.billAmount}
        bookingRef={bookingDetails?.bookingRef || confirmedBookingId}
        bookingId={bookingDetails?.bookingId}
        offerTitle={bookingDetails?.offerTitle || activeOption.title}
        offerDiscountPct={bookingDetails?.discountPct != null ? Number(bookingDetails.discountPct) : (activeOption.discountPct || 0)}
        coverChargeAmount={bookingDetails?.totalCoverCharge != null ? Number(bookingDetails.totalCoverCharge) : totalCoverCharge}
        customerPhone={bookingDetails?.customerPhone || guestPhone || appStore.currentUser?.phone || ""}
        customerName={bookingDetails?.customerName || guestName || appStore.currentUser?.name || "Guest Customer"}
        customerId={customerId}
        customerCoins={customerCoins}
        cashbackPercentage={fetchedData?.store?.cashbackPercentage != null ? Number(fetchedData.store.cashbackPercentage) : (storeData?.cashbackPercentage != null ? Number(storeData.cashbackPercentage) : undefined)}
        maxCashbackAmount={fetchedData?.store?.maxCashbackAmount != null ? Number(fetchedData.store.maxCashbackAmount) : (storeData?.maxCashbackAmount != null ? Number(storeData.maxCashbackAmount) : undefined)}
        minTransactionForCashback={fetchedData?.store?.minTransactionForCashback != null ? Number(fetchedData.store.minTransactionForCashback) : (storeData?.minTransactionForCashback != null ? Number(storeData.minTransactionForCashback) : undefined)}
        isCashbackEnabled={fetchedData?.store?.isCashbackEnabled ?? storeData?.isCashbackEnabled}
        cashbackName={fetchedData?.store?.cashbackName}
        onBack={() => {
          setShowPayBillView(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onPaymentSuccess={(details) => {
          toast.success(`Payment of ₹${details.totalPaid} Successful!`, {
            description: `Paid to ${effectiveStoreName}. Transaction #${details.txnId}`
          });
          setShowPayBillView(false);
        }}
      />
    );
  }

  if (loading && bookingStep !== "confirmed") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center font-['Manrope']">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
          Loading reservation options...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Fetching live offers and table slots from backend
        </p>
      </div>
    );
  }

  // Step 3: Confirmed / Cancelled Screen
  if (bookingStep === "confirmed") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-28 animate-in fade-in duration-200">
        <div>
          {/* Top Header with Back, Help buttons (and Share if not cancelled) */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              {!isCancelled && (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: `Table booked at ${effectiveStoreName}`,
                          text: `Reservation confirmed at ${effectiveStoreName} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}.`
                        })
                        .catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success("Reservation details copied to clipboard!");
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  toast.info("PINAK 24/7 Concierge Support", {
                    description: isCancelled
                      ? "Have questions regarding your cancellation or cover charge refund? Contact +91 800-PINAK-HELP"
                      : `Need help with your reservation at ${effectiveStoreName}? Contact +91 800-PINAK-HELP`
                  });
                }}
                className="h-8 px-3 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <MessageSquare size={13} />
                <span>Help</span>
              </button>
            </div>
          </header>

          <div className="p-3.5 space-y-3.5">
            {/* Hero Section: Signature PINAK Purple Check if Booked, Rose Red X if Cancelled */}
            {isCancelled ? (
              <div className="text-center pt-3 pb-1">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl scale-175 animate-pulse" />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center relative shadow-lg shadow-rose-600/30">
                    <X size={28} className="stroke-[3.5]" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  Booking cancelled
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Reservation ref #{confirmedBookingId}
                </p>
              </div>
            ) : (
              <div className="text-center pt-3 pb-1">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl scale-150 animate-pulse" />
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 text-white flex items-center justify-center relative shadow-lg shadow-purple-700/30">
                    <Check size={28} className="stroke-[3.5]" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Your table is booked!
                </h1>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-bold mt-0.5">
                  Instant confirmation • Offer locked
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Booking ID: #{confirmedBookingId}
                </p>
              </div>
            )}

            {/* Reservation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-black block tracking-tight",
                      isCancelled
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-purple-700 dark:text-purple-300"
                    )}
                  >
                    {isCancelled ? "Cancelled" : "Confirmed"}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {(bookingDetails?.discountPct || activeOption.discountPct) ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase">
                        {(bookingDetails?.discountPct || activeOption.discountPct)}% OFF
                      </span>
                    ) : null}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate max-w-[200px]">
                      {bookingDetails?.offerTitle || activeOption.title}
                    </span>
                  </div>
                </div>

                {/* Cancellation Refund Banner (Only if cancelled) */}
                {isCancelled && (
                  <div className="flex items-center justify-between bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl px-3 py-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Refund ARN Ref</span>
                      <span className="text-xs font-black tracking-wide text-rose-700 dark:text-rose-300 font-mono">
                        {bookingDetails?.refundRef || "REF-PNK-882941"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Refund Initiated</span>
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                        ₹{bookingDetails?.refundAmount ?? totalCoverCharge} (100%)
                      </span>
                    </div>
                  </div>
                )}

                {/* 3 Column Grid: Date, Meal & Slot, Guests */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {bookingDetails?.formattedDate
                        ? bookingDetails.formattedDate.split(",")[0] || selectedDate.dayName
                        : (bookingDetails?.bookingDate
                            ? (() => {
                                const d = new Date(bookingDetails.bookingDate);
                                return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString()
                                  ? "Today"
                                  : d.toLocaleDateString("en-US", { weekday: "short" });
                              })()
                            : selectedDate.dayName)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {bookingDetails?.bookingDate
                        ? (() => {
                            const d = new Date(bookingDetails.bookingDate);
                            return !isNaN(d.getTime())
                              ? `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleDateString("en-US", { month: "short" })} ${d.getFullYear()}`
                              : `${selectedDate.dayNum} ${selectedDate.month} ${selectedDate.fullDate.getFullYear()}`;
                          })()
                        : `${selectedDate.dayNum} ${selectedDate.month} ${selectedDate.fullDate.getFullYear()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {(bookingDetails?.mealType || mealType) === "DINNER" ? "Dinner" : "Lunch"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {bookingDetails?.slotTime || selectedSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      for {bookingDetails?.guests || selectedGuests}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      guests
                    </p>
                  </div>
                </div>

                {/* Guest Details Row */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                      <User size={13} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Reserved For</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {bookingDetails?.customerName || guestName || "Guest Diner"}
                      </span>
                    </div>
                  </div>
                  {(bookingDetails?.customerPhone || guestPhone) && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Contact</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {bookingDetails?.customerPhone || guestPhone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Restaurant details with Call & Directions buttons in PINAK Palette */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {effectiveStoreName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {effectiveAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (effectivePhone) {
                          window.location.href = `tel:${effectivePhone}`;
                        } else {
                          toast.info(`Contacting ${effectiveStoreName}`, {
                            description: "Phone concierge is available at +91 800-PINAK-HELP"
                          });
                        }
                      }}
                      className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition cursor-pointer border border-purple-200 dark:border-purple-800/60 shadow-2xs"
                      title="Call Restaurant"
                    >
                      <Phone size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(effectiveMapsUrl, "_blank");
                      }}
                      className="w-10 h-10 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition cursor-pointer border border-purple-200 dark:border-purple-800/60 shadow-2xs"
                      title="Directions"
                    >
                      <MapPin size={17} />
                    </button>
                  </div>
                </div>

                {/* Pay bill now button (Only if NOT cancelled) */}
                {!isCancelled && (
                  bookingDetails?.status === "COMPLETED" ? (
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                      <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center gap-2">
                        <Check size={16} className="text-emerald-600 stroke-[3]" />
                        <span>Dining Bill Paid &amp; Settled</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />
                      <button
                        type="button"
                        onClick={() => {
                          if (onPayBill) {
                            onPayBill();
                          } else {
                            setShowPayBillView(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black active:scale-98 transition text-sm shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer animate-in fade-in"
                      >
                        {bookingDetails?.billAmount && Number(bookingDetails.billAmount) > 0 ? (
                          <span>Pay bill now • ₹{Number(bookingDetails.billAmount).toLocaleString("en-IN")}</span>
                        ) : (
                          <span>Pay bill now</span>
                        )}
                        <ArrowRight size={16} />
                      </button>
                      {bookingDetails?.billAmount && Number(bookingDetails.billAmount) > 0 ? (
                        <p className="text-[11px] text-center text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                          ✓ Bill added by restaurant
                        </p>
                      ) : (
                        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium pt-1">
                          Enter bill amount directly or wait for restaurant to add
                        </p>
                      )}
                    </>
                  )
                )}
              </div>

              {/* Attached bottom perks strip in PINAK Purple & Amber Coins */}
              <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border-t border-purple-100 dark:border-purple-900/50 px-4 py-2.5 flex items-center gap-2 text-xs">
                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  🪙 2X
                </span>
                <span className="font-bold text-purple-900 dark:text-purple-200 text-[11px] truncate">
                  {effectiveCashbackText}
                </span>
              </div>
            </div>

            {/* Promo Feature Banner */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 justify-center text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                <Sparkles size={11} className="fill-purple-600 text-purple-600" />
                <span>NEW ON PINAK</span>
              </div>
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between border border-purple-900/40">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">
                    INSTANT REWARD
                  </span>
                  <h4 className="text-base font-black text-white leading-tight">
                    Show this pass to Host
                  </h4>
                  <p className="text-[11px] text-purple-200/80 mt-1">
                    Your table is guaranteed. Just show your PINAK booking pass upon arrival.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/15">
                  <Smartphone size={24} className="text-purple-200" />
                </div>
              </div>
            </div>

            {/* View restaurant details strip */}
            <div
              onClick={() => {
                if (onViewStoreDetails) {
                  onViewStoreDetails(bookingDetails?.storeId || storeId);
                } else {
                  onBack();
                }
              }}
              className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-900/40 transition group"
            >
              <span className="text-sm font-black text-purple-800 dark:text-purple-200">
                View {effectiveStoreName} details
              </span>
              <ArrowRight
                size={18}
                className="text-purple-700 dark:text-purple-300 transition-transform group-hover:translate-x-0.5"
              />
            </div>

            {/* Cancellation Row (Only if NOT cancelled and NOT completed) */}
            {!isCancelled && bookingDetails?.status !== "COMPLETED" && (
              <div className="flex items-center justify-between px-2 pt-1 pb-1 text-xs">
                <span className="text-slate-500 font-medium">Can't make it to the restaurant?</span>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline cursor-pointer"
                >
                  Cancel booking
                </button>
              </div>
            )}

            {/* "Offer terms & conditions" Accordion */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsConfirmedTermsOpen((v) => !v)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
              >
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Offer terms & conditions
                </h3>
                <ChevronDown
                  size={15}
                  className={cn(
                    "text-purple-600 dark:text-purple-400 transition-transform duration-200",
                    isConfirmedTermsOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {isConfirmedTermsOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {resolvedTermsList.map((term, idx) => (
                    <p key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">•</span>
                      <span>{term}</span>
                    </p>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Cancel Table Reservation?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to cancel your table at{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {effectiveStoreName}
                  </span>?
                </p>
                {totalToPay > 0 && (
                  <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-xl border border-purple-200/60 dark:border-purple-800/60">
                    ₹{totalToPay} paid will be automatically refunded to your original payment method.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancellation}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Yes, Cancel</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Center Done Button in PINAK Royal Purple Gradient */}
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto px-12 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Pre-book Bill Details & Payment Screen
  if (bookingStep === "checkout_bill") {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-28 animate-in fade-in duration-200">
        <div>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setBookingStep("select_slot");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
              aria-label="Back to slot selection"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="overflow-hidden min-w-0">
              <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">
                {effectiveStoreName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                {effectiveAddress}
              </p>
            </div>
          </header>

          <div className="p-3.5 space-y-3.5">
            {/* Top Highlight Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 flex items-center justify-between text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <span className="text-xs font-bold leading-snug">
                {totalCoverCharge > 0
                  ? `Your cover charge of ₹${totalCoverCharge} will be redeemed when you pay your bill via PINAK`
                  : `Free Table Pre-Booking • Instant reservation confirmation at ${effectiveStoreName}`}
              </span>
              <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 fill-emerald-500/20 shrink-0 ml-2" />
            </div>

            {/* Booking Details Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 space-y-3">
                {/* 3 Columns Header */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {selectedDate.dayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {selectedDate.dayNum} {selectedDate.month} {selectedDate.fullDate.getFullYear()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      {mealType === "DINNER" ? "Dinner" : "Lunch"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {selectedSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                      for {selectedGuests}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      guests
                    </p>
                  </div>
                </div>

                {/* Guest Details Row */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
                      <User size={13} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Reserved For</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {bookingDetails?.customerName || guestName || "Guest Diner"}
                      </span>
                    </div>
                  </div>
                  {(bookingDetails?.customerPhone || guestPhone) && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Contact</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {bookingDetails?.customerPhone || guestPhone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Restaurant Name & Locality */}
                <div className="pt-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {effectiveStoreName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {effectiveAddress}
                  </p>
                </div>

                {/* Applied Offer Box */}
                <div className="pt-2">
                  <div className="border border-purple-200 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/30 rounded-xl p-3 relative pt-3.5">
                    <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-[9.5px] font-black px-2 py-0.5 rounded shadow-2xs uppercase tracking-wide flex items-center gap-1">
                      <span className="font-sans lowercase font-extrabold text-xs">pinak</span>
                      <span>Pre-book Offer</span>
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                      {activeOption.title}
                    </p>
                    {activeOption.subtitle && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {activeOption.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Strip inside Card */}
              <div className="bg-purple-50/60 dark:bg-purple-950/30 border-t border-purple-100/80 dark:border-purple-900/40 px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  {totalCoverCharge > 0 ? (
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Redeem ₹{totalCoverCharge} cover +
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Zero cover charge +
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-900 dark:text-amber-200 shadow-2xs">
                    <span>🪙 2X</span>
                  </div>
                  <span className="font-bold text-purple-900 dark:text-purple-200 truncate">
                    {effectiveCashbackText}
                  </span>
                </div>
              </div>
            </div>

            {/* Special VIP Plan Added For You Card */}
            <div className="pt-1.5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-2 relative pt-3.5">
                <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded shadow-2xs uppercase tracking-wide">
                  Special plan added for you
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-700 dark:text-purple-300 text-sm tracking-tight font-sans">
                      pinak <span className="text-slate-900 dark:text-white font-bold">1 Month VIP Plan</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ₹1
                    </span>
                    <input
                      type="checkbox"
                      checked={includeVipPlan}
                      onChange={(e) => setIncludeVipPlan(e.target.checked)}
                      className="accent-purple-700 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Enjoy unlimited access to pre-book dining offers, 2X Coin boost &amp; zero reservation fees.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    toast.info("PINAK VIP gives unlimited cashback + zero reservation fees on 7500+ merchants.")
                  }
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer pt-0.5"
                >
                  <span>View all benefits</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Bill Details Section */}
            <section className="space-y-2 pt-1">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Bill Details
              </h2>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
                {/* Pre-Booking Dining Offer Row */}
                <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Percent size={11} className="stroke-[3]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {activeOption.title}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Offer Locked • Applied on total food bill at dining
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 uppercase">
                    {activeOption.discountPct ? `${activeOption.discountPct}% OFF` : "OFFER LOCKED"}
                  </span>
                </div>

                {/* Cover charges row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Cover charges for {selectedGuests} guest{selectedGuests > 1 ? "s" : ""}
                    </p>
                    {totalCoverCharge > 0 ? (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                        Redeemable against your dining bill via PINAK
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        Zero cover charge • Free Pre-booking
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {totalCoverCharge > 0 ? `₹${totalCoverCharge}` : "₹0"}
                  </span>
                </div>

                {/* VIP Plan Row */}
                {includeVipPlan && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-purple-700 dark:text-purple-300 font-black">pinak</span> 1 Month Plan
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      ₹1
                    </span>
                  </div>
                )}

                {/* Dashed Separator */}
                <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    To Pay
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{totalToPay}
                  </span>
                </div>
              </div>
            </section>

            {/* Offer terms & conditions Accordion */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsCheckoutTermsOpen((v) => !v)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
              >
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  Offer terms &amp; conditions
                </h3>
                <ChevronDown
                  size={15}
                  className={cn(
                    "text-purple-600 dark:text-purple-400 transition-transform duration-200",
                    isCheckoutTermsOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {isCheckoutTermsOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {resolvedTermsList.map((term, idx) => (
                    <p key={idx} className="flex items-start gap-1.5">
                      <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">•</span>
                      <span>{term}</span>
                    </p>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Sticky Bottom Payment Bar */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 max-w-[430px] mx-auto shadow-2xl flex items-center justify-between gap-3">
          {/* Left: Pay using */}
          <div
            onClick={() => {
              setSelectedPaymentMethod((prev) =>
                prev === "Google Pay"
                  ? "PhonePe"
                  : prev === "PhonePe"
                  ? "PINAK UPI"
                  : "Google Pay"
              );
            }}
            className="cursor-pointer select-none pl-1 flex flex-col justify-center"
          >
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 flex items-center justify-center text-[8px] font-bold">
                ▲
              </span>
              <span>PAY USING ▲</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {selectedPaymentMethod}
              </span>
            </div>
          </div>

          {/* Right: Signature PINAK Purple Pay Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmPaymentAndBooking}
            className="flex-1 max-w-[190px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-purple-900/25 active:scale-98 transition cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={15} className="animate-spin" />
                <span>Confirming...</span>
              </span>
            ) : (
              <span>{totalToPay > 0 ? `Pay ₹${totalToPay}` : "Confirm Booking"}</span>
            )}
          </button>
        </footer>
      </div>
    );
  }

  // Step 1: Slot & Offer Selection Screen
  return (
    <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-['Manrope'] pb-24">
      <div>
        {/* ========================================================= */}
        {/* 1. TOP HEADER */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-30 bg-[#fbfbff]/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="overflow-hidden min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Book table
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">
              {effectiveStoreName} • {effectiveCuisines}
            </p>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. TOP REWARD CASHBACK PERK STRIP */}
        {/* ========================================================= */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-dashed border-emerald-200 dark:border-emerald-800/60 px-4 py-2.5 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs">
            ₹
          </div>
          <div className="text-xs font-bold leading-tight">
            <span>{effectiveCashbackText}</span>
          </div>
        </div>

        <div className="px-4 py-3 space-y-5">
          {/* ========================================================= */}
          {/* 3. NUMBER OF GUESTS */}
          {/* ========================================================= */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Number of guest(s)
              </h2>
              {activeOption.minPartySize && (
                <span className="text-[10px] text-slate-400 font-semibold">
                  Min {activeOption.minPartySize} • Max {activeOption.maxPartySize || 12}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {guestOptions.map((num) => {
                const isSelected = selectedGuests === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedGuests(num)}
                    className={cn(
                      "w-12 h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center cursor-pointer shrink-0",
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-950/60 border-2 border-purple-600 text-purple-700 dark:text-purple-300 shadow-xs scale-102"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    )}
                  >
                    {num === 8 && guestOptions.length <= 8 ? "8+" : num}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 4. WHEN ARE YOU VISITING? (DATE CAROUSEL) */}
          {/* ========================================================= */}
          <section>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2.5">
              When are you visiting?
            </h2>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {upcomingDates.map((dateObj, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <button
                    key={dateObj.key}
                    type="button"
                    onClick={() => setSelectedDateIndex(idx)}
                    className={cn(
                      "w-20 py-2.5 px-1.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer shrink-0 relative",
                      isSelected
                        ? "bg-purple-50/80 dark:bg-purple-950/60 border-2 border-purple-600 text-slate-900 dark:text-white shadow-xs scale-102"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                    )}
                  >
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dateObj.month}
                    </span>
                    <span
                      className={cn(
                        "text-base font-black my-0.5",
                        isSelected
                          ? "text-purple-700 dark:text-purple-300"
                          : "text-slate-900 dark:text-white"
                      )}
                    >
                      {dateObj.dayNum}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      {dateObj.dayName}
                    </span>
                    <span
                      className={cn(
                        "font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs",
                        dateObj.isDayActive
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {dateObj.discount}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* 5. TIME SLOTS CONTAINER WITH LUNCH/DINNER TOGGLE */}
          {/* ========================================================= */}
          <section className="bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-3.5">
            {/* Meal Segmented Control */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMealType("LUNCH");
                  if (lunchSlots.length > 0) setSelectedSlot(lunchSlots[0].time);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mealType === "LUNCH"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-purple-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                )}
              >
                <Sun size={13} className="stroke-[2.5]" />
                <span>Lunch ({lunchSlots.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMealType("DINNER");
                  if (dinnerSlots.length > 0) setSelectedSlot(dinnerSlots[0].time);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mealType === "DINNER"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-purple-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                )}
              >
                <Moon size={13} className="stroke-[2.5]" />
                <span>Dinner ({dinnerSlots.length})</span>
              </button>
            </div>

            {/* Slots Grid */}
            {currentSlots.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
                No slots available for {mealType.toLowerCase()}. Please switch to{" "}
                <button
                  type="button"
                  onClick={() =>
                    setMealType(mealType === "LUNCH" ? "DINNER" : "LUNCH")
                  }
                  className="text-purple-700 font-bold underline"
                >
                  {mealType === "LUNCH" ? "Dinner" : "Lunch"}
                </button>
                .
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(showAllSlots ? currentSlots : currentSlots.slice(0, 12)).map((slot) => {
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot.time)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center border",
                        isSelected
                          ? "bg-purple-50 dark:bg-purple-950/60 border-2 border-purple-600 text-slate-900 dark:text-white shadow-xs"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] font-extrabold leading-tight",
                          isSelected
                            ? "text-purple-700 dark:text-purple-300"
                            : "text-slate-800 dark:text-white"
                        )}
                      >
                        {slot.time}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        {slot.discount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentSlots.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllSlots((v) => !v)}
                className="w-full text-center text-[11px] font-bold text-purple-700 dark:text-purple-400 flex items-center justify-center gap-1 py-1 hover:underline cursor-pointer"
              >
                <span>{showAllSlots ? "Show fewer slots" : "View all slots"}</span>
                <ChevronDown
                  size={12}
                  className={cn("transition-transform", showAllSlots ? "rotate-180" : "")}
                />
              </button>
            )}
          </section>

          {/* ========================================================= */}
          {/* 6. BOOKING OPTIONS FOR SELECTED TIME */}
          {/* ========================================================= */}
          <section className="space-y-3 pt-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Booking options for {selectedSlot}
            </h2>

            {/* Exclusive Card Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-black text-xs uppercase tracking-wider">
                <Sparkles size={13} className="fill-purple-600 text-purple-600" />
                <span>PINAK EXCLUSIVE OFFERS</span>
              </div>

              {/* Radio options */}
              <div className="space-y-2.5">
                {exclusiveOptions.map((opt) => {
                  const isChecked = selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={cn(
                        "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                        isChecked
                          ? "bg-purple-50/40 dark:bg-purple-950/30 border-purple-600 ring-1 ring-purple-600/30"
                          : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      {/* Radio button */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                            isChecked
                              ? "border-purple-600 bg-purple-600"
                              : "border-slate-400 bg-white dark:bg-slate-800"
                          )}
                        >
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                          {opt.title}
                        </p>
                        {opt.subtitle && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {opt.subtitle}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          {opt.coverChargePerGuest > 0 ? (
                            <>
                              Redeemable cover charge:{" "}
                              <strong className="text-slate-800 dark:text-slate-200">
                                ₹{opt.coverChargePerGuest}/guest
                              </strong>
                            </>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Zero cover charge • Free reservation
                            </span>
                          )}
                        </p>
                        {opt.perkHighlight && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            {opt.perkHighlight}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Auto added plan banner */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span className="truncate">
                  1 month PINAK VIP plan for ₹1 available in checkout.
                </span>
                <span
                  onClick={() =>
                    toast.info("PINAK VIP membership unlocks exclusive pre-booking dining discounts.")
                  }
                  className="font-bold text-purple-700 dark:text-purple-400 shrink-0 ml-1 hover:underline cursor-pointer"
                >
                  View benefits
                </span>
              </div>
            </div>

            {/* Regular Offer Card */}
            {regularOption && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  REGULAR OFFER
                </span>

                <div
                  onClick={() => setSelectedOptionId("opt_regular")}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                    selectedOptionId === "opt_regular"
                      ? "bg-purple-50/40 dark:bg-purple-950/30 border-purple-600 ring-1 ring-purple-600/30"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  {/* Radio button */}
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        selectedOptionId === "opt_regular"
                          ? "border-purple-600 bg-purple-600"
                          : "border-slate-400 bg-white dark:bg-slate-800"
                      )}
                    >
                      {selectedOptionId === "opt_regular" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {regularOption.title || "Standard table booking"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Cover charge:{" "}
                      {regularOption.coverChargePerGuest && regularOption.coverChargePerGuest > 0 ? (
                        <strong className="text-purple-600 font-bold">
                          ₹{regularOption.coverChargePerGuest} / guest
                        </strong>
                      ) : (
                        <strong className="text-emerald-600">FREE</strong>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              Coupons &amp; additional offers available during bill payment
            </p>
          </section>

          {/* ========================================================= */}
          {/* 7. OFFER TERMS AND CONDITIONS ACCORDION */}
          {/* ========================================================= */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsTermsOpen((v) => !v)}
              className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            >
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Offer terms and conditions
              </h3>
              <ChevronDown
                size={14}
                className={cn(
                  "text-slate-400 transition-transform duration-200",
                  isTermsOpen ? "rotate-180" : ""
                )}
              />
            </button>

            {isTermsOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {resolvedTermsList.map((term, idx) => (
                  <p key={idx} className="flex items-start gap-1.5">
                    <span className="text-purple-600 dark:text-purple-400 font-bold shrink-0">•</span>
                    <span>{term}</span>
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 8. STICKY BOTTOM ACTION BAR (Slot Selection Step) */}
      {/* ========================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 max-w-[430px] mx-auto shadow-2xl">
        <button
          type="button"
          onClick={handleProceedToCheckout}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-98 transition cursor-pointer"
        >
          <span>Proceed to pay</span>
        </button>
      </footer>
    </div>
  );
};

export default TableBookingView;
