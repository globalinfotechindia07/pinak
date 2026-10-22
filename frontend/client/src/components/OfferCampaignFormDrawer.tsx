import React, { useState, useMemo, useEffect } from "react";
import {
  TicketPercent,
  X,
  Building2,
  Store as StoreIcon,
  Utensils,
  ShoppingBag,
  Clock,
  Users,
  Armchair,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Tag,
  Coins,
  Zap,
  Calendar,
  Image as ImageIcon,
  Eye,
  Wand2,
  Calculator,
  AlertCircle,
  MapPin,
  Phone,
  Scissors,
  Dumbbell,
  Car,
  Gamepad2,
  Stethoscope,
  Shirt,
  HeartPulse,
  Package
} from "lucide-react";
import { Offer, Store, Merchant } from "../types";
import { offerCampaignSchema } from "../lib/validationSchemas";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export interface OfferCampaignFormDrawerProps {
  merchants?: Merchant[];
  stores?: Store[];
  merchantId?: string;
  merchantName?: string;
  initialData?: Offer | null;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (draft: Partial<Offer>) => void | Promise<any>;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STANDARD_SLOTS = [
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
  "08:30 PM",
  "09:00 PM",
  "09:30 PM",
  "10:00 PM"
];

const SEATING_AREA_OPTIONS = [
  "Indoor AC Dining",
  "Outdoor / Rooftop",
  "Balcony / Courtyard",
  "Private Dining Room (PDR)",
  "Lounge / Bar Counter"
];

const PRODUCT_CATEGORIES = [
  { key: "GROCERY", label: "Grocery & Staples", icon: ShoppingBag },
  { key: "ELECTRONICS", label: "Electronics & Tech", icon: Zap },
  { key: "FASHION", label: "Fashion & Apparel", icon: Shirt },
  { key: "WELLNESS", label: "Pharmacy & Nutrition", icon: HeartPulse },
  { key: "HOME", label: "Home & Kitchen", icon: Package },
  { key: "BEAUTY", label: "Beauty & Cosmetics", icon: Sparkles },
  { key: "BAKERY", label: "Bakery & Treats", icon: Utensils }
];

const CURATED_IMAGES = {
  STORE_DINING: [
    { label: "Luxury Dining", url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80" },
    { label: "Rooftop Romantic", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" },
    { label: "Royal Buffet", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" },
    { label: "Cafe & Coffee", url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80" }
  ],
  STORE_SERVICE: [
    { label: "Salon & Spa", url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=800&q=80" },
    { label: "Gym & Fitness", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
    { label: "Car Wash", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80" },
    { label: "Health & Dental", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" }
  ],
  STORE_PRODUCT: [
    { label: "Grocery Ration", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" },
    { label: "Fresh Milk Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80" },
    { label: "ANC Earbuds", url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80" },
    { label: "Cotton Tees", url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }
  ]
};

export const OfferCampaignFormDrawer: React.FC<OfferCampaignFormDrawerProps> = ({
  merchants = [],
  stores = [],
  merchantId: propMerchantId = "",
  merchantName: propMerchantName = "",
  initialData = null,
  isEdit = false,
  onClose,
  onSave
}) => {
  // Wizard Steps (1: Merchant & Store -> 2: Offer Scope -> 3: Rules & Pricing -> 4: Merchandising & Preview)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // STEP 1: MERCHANT & STORE SELECTION
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    initialData?.merchantId || propMerchantId || (merchants.length > 0 ? merchants[0].id : "")
  );

  const selectedMerchant = useMemo(() => {
    return merchants.find((m) => m.id === selectedMerchantId);
  }, [merchants, selectedMerchantId]);

  const merchantDisplayName =
    propMerchantName || selectedMerchant?.businessName || "Selected Brand";

  // Stores strictly belonging to the selected merchant
  const availableStoresForMerchant = useMemo(() => {
    if (!selectedMerchantId) return [];
    return stores.filter((s) => s.merchantId === selectedMerchantId);
  }, [stores, selectedMerchantId]);

  // Specific Store selection ('all' or specific store ID)
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    initialData?.storeId || (initialData?.applicableStoreIds && initialData.applicableStoreIds[0]) || "all"
  );

  // Auto-update selectedStoreId when merchant changes
  useEffect(() => {
    if (availableStoresForMerchant.length > 0) {
      if (selectedStoreId !== "all" && !availableStoresForMerchant.some((s) => s.id === selectedStoreId)) {
        setSelectedStoreId(availableStoresForMerchant[0].id);
      }
    } else {
      setSelectedStoreId("all");
    }
  }, [selectedMerchantId, availableStoresForMerchant]);

  const selectedStore = useMemo(() => {
    return availableStoresForMerchant.find((s) => s.id === selectedStoreId);
  }, [availableStoresForMerchant, selectedStoreId]);

  // STEP 2: OFFER SCOPE & TARGET
  // "SERVICE" = Store-level offer / Table Booking / Dine-in discount
  // "PRODUCT" = Specific product sold at this store
  const [offerScope, setOfferScope] = useState<"STORE_OFFER" | "STORE_PRODUCT">(
    initialData?.scopeType === "PRODUCT" ? "STORE_PRODUCT" : "STORE_OFFER"
  );

  // For Store Product Deals
  const [productName, setProductName] = useState<string>(
    initialData?.scopeType === "PRODUCT" ? initialData.title || "" : ""
  );
  const [productCategory, setProductCategory] = useState<string>(
    initialData?.productCategory || "GROCERY"
  );
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(initialData?.originalPrice);
  const [dealPrice, setDealPrice] = useState<number | undefined>(initialData?.dealPrice);
  const [isFlashDeal, setIsFlashDeal] = useState<boolean>(initialData?.isFlashDeal || false);
  const [flashEndTime, setFlashEndTime] = useState<string>(
    initialData?.flashEndTime || new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [totalFlashUnits, setTotalFlashUnits] = useState<number | undefined>(initialData?.totalFlashUnits ?? 50);

  // For Store Table / Slot Booking Engine
  const [isTableBookingEnabled, setIsTableBookingEnabled] = useState<boolean>(
    initialData?.isTableBookingEnabled ?? true
  );
  const [bookingType, setBookingType] = useState<"TABLE_RESERVATION" | "APPOINTMENT_SLOT">(
    initialData?.bookingType || "TABLE_RESERVATION"
  );
  const [slotTimes, setSlotTimes] = useState<string[]>(
    initialData?.slotTimes || [
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM"
    ]
  );
  const [minPartySize, setMinPartySize] = useState<number>(initialData?.minPartySize ?? 2);
  const [maxPartySize, setMaxPartySize] = useState<number>(initialData?.maxPartySize ?? 6);
  const [availableTablesPerSlot, setAvailableTablesPerSlot] = useState<number>(
    initialData?.availableTablesPerSlot ?? 4
  );
  const [seatingAreas, setSeatingAreas] = useState<string[]>(
    initialData?.seatingAreas || ["Indoor AC Dining", "Outdoor / Rooftop"]
  );
  const [coverChargeAmount, setCoverChargeAmount] = useState<number>(
    initialData?.coverChargeAmount ?? 0
  );
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState<number>(
    initialData?.gracePeriodMinutes ?? 15
  );
  const [instantConfirmation, setInstantConfirmation] = useState<boolean>(
    initialData?.instantConfirmation ?? true
  );
  const [newSlotInput, setNewSlotInput] = useState<string>("");

  // STEP 3: DEAL RULES & PRICING
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO">(
    initialData?.type || "FLAT_PCT"
  );
  const [value, setValue] = useState<number>(initialData?.value ?? 40);
  const [minBillAmount, setMinBillAmount] = useState<number>(initialData?.minBillAmount ?? 500);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(initialData?.maxDiscount ?? 200);
  const [bonusCoins, setBonusCoins] = useState<number>(initialData?.bonusCoins ?? 100);
  const [perUserLimit, setPerUserLimit] = useState<number | undefined>(initialData?.perUserLimit ?? 1);
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState<number | undefined>(
    initialData?.maxTotalRedemptions ?? 500
  );

  const [redemptionMethod, setRedemptionMethod] = useState<"AUTO_APPLIED" | "PROMO_CODE">(
    initialData?.redemptionMethod || "AUTO_APPLIED"
  );
  const [promoCode, setPromoCode] = useState<string>(initialData?.promoCode || "DISTRICT40");

  // STEP 4: MERCHANDISING & SCHEDULE
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [tagline, setTagline] = useState<string>(initialData?.tagline || "");
  const [badgeText, setBadgeText] = useState<string>(
    initialData?.badgeText || (offerScope === "STORE_PRODUCT" ? "STORE FLASH" : "DISTRICT SPECIAL")
  );
  const [ctaText, setCtaText] = useState<string>(
    initialData?.ctaText || (offerScope === "STORE_PRODUCT" ? "Add to Cart" : isTableBookingEnabled ? "Reserve Table" : "Book & Pay")
  );
  const [validFrom, setValidFrom] = useState(
    initialData?.validFrom ? initialData.validFrom.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [validTo, setValidTo] = useState(
    initialData?.validTo ? initialData.validTo.split("T")[0] : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [activeDays, setActiveDays] = useState<string[]>(
    initialData?.activeDays || ALL_DAYS
  );
  const [enableHappyHours, setEnableHappyHours] = useState(!!initialData?.startTime);
  const [startTime, setStartTime] = useState(initialData?.startTime || "12:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "22:00");
  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
  );
  const [terms, setTerms] = useState<string>(
    initialData?.terms || "Valid on dine-in bill and confirmed table reservations."
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculated discount % for product deals
  const computedProductDiscountPct = useMemo(() => {
    if (originalPrice && dealPrice && originalPrice > dealPrice) {
      return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
    }
    return null;
  }, [originalPrice, dealPrice]);

  // Sync title when in product mode if title is empty
  useEffect(() => {
    if (offerScope === "STORE_PRODUCT" && productName && !title) {
      setTitle(`${productName} - Special Store Deal`);
    }
  }, [productName, offerScope, title]);

  // Helper actions
  const toggleSlot = (slot: string) => {
    setSlotTimes((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const addCustomSlot = () => {
    const val = newSlotInput.trim().toUpperCase();
    if (!val) return;
    if (!slotTimes.includes(val)) {
      setSlotTimes((prev) => [...prev, val]);
      setNewSlotInput("");
      toast.success(`Added slot: ${val}`);
    } else {
      toast.error("Slot already exists");
    }
  };

  const toggleSeatingArea = (area: string) => {
    setSeatingAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  // 1-Click Auto Title Generator based on Merchant, Store and Discount
  const handleGenerateTitle = () => {
    const storeLabel = selectedStore ? selectedStore.branchName : "All Branches";
    if (offerScope === "STORE_PRODUCT") {
      const pName = productName.trim() || "Retail Product";
      const disc = computedProductDiscountPct ? `${computedProductDiscountPct}% OFF` : `Special Deal`;
      setTitle(`${pName} @ ${disc} (${storeLabel})`);
      setTagline(`Exclusive store bargain at ${merchantDisplayName} • Limited stock available`);
    } else {
      const disc = type === "FLAT_PCT" ? `${value}% OFF` : type === "FLAT_AMT" ? `Flat ₹${value} OFF` : "Buy 1 Get 1 FREE";
      const exp = isTableBookingEnabled ? "Table Reservation" : "Dine-in Experience";
      setTitle(`${disc} ${exp} @ ${storeLabel}`);
      setTagline(`Enjoy confirmed table booking & exclusive bill savings at ${merchantDisplayName}`);
    }
    toast.success("Generated title & tagline based on store details!");
  };

  // 1-Click Standard Terms & Conditions Generator
  const handleGenerateTerms = () => {
    const storeLabel = selectedStore ? selectedStore.branchName : "all participating brand outlets";
    const parts: string[] = [];
    parts.push(`Offer valid exclusively at ${merchantDisplayName} (${storeLabel}).`);
    if (offerScope === "STORE_OFFER" && isTableBookingEnabled) {
      parts.push(`Table held up to ${gracePeriodMinutes} minutes from booked slot arrival.`);
      parts.push(`Valid for party size of ${minPartySize} to ${maxPartySize} guests.`);
      if (coverChargeAmount > 0) {
        parts.push(`Cover charge deposit of ₹${coverChargeAmount} will be adjusted against the final bill.`);
      }
    }
    if (offerScope === "STORE_PRODUCT") {
      parts.push(`Product item must be collected at store express billing counter.`);
      if (isFlashDeal && totalFlashUnits) {
        parts.push(`Limited flash stock of ${totalFlashUnits} units only.`);
      }
    }
    if (type === "FLAT_PCT") {
      parts.push(`Discount of ${value}% applied up to maximum ₹${maxDiscount || 'unlimited'} on bills of ₹${minBillAmount} & above.`);
    } else if (type === "FLAT_AMT") {
      parts.push(`Flat discount of ₹${value} applied on minimum bill of ₹${minBillAmount}.`);
    } else {
      parts.push(`Buy 1 Get 1 free applicable on item of equal or lesser value.`);
    }
    parts.push(`Cannot be clubbed with existing in-store promotions or corporate cards.`);
    setTerms(parts.join(" "));
    toast.success("Standard store terms generated!");
  };

  // 1-Click Promo Code Generator
  const handleGeneratePromo = () => {
    const prefix = offerScope === "STORE_PRODUCT" ? "PROD" : "STORE";
    const num = type === "FLAT_PCT" ? value : type === "FLAT_AMT" ? value : "50";
    const code = `${prefix}${num}${Math.floor(100 + Math.random() * 900)}`;
    setPromoCode(code);
    toast.success(`Generated Code: ${code}`);
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedMerchantId) {
        toast.error("Please select a partner merchant brand.");
        return;
      }
      if (availableStoresForMerchant.length === 0) {
        toast.error("This merchant has no registered stores. A merchant must have at least one store before creating an offer.");
        return;
      }
      if (!selectedStoreId || selectedStoreId === "all") {
        setSelectedStoreId(availableStoresForMerchant[0].id);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (offerScope === "STORE_PRODUCT") {
        if (!productName.trim()) {
          toast.error("Please enter the product name sold at this store.");
          return;
        }
        if (!dealPrice || dealPrice <= 0) {
          toast.error("Please enter a valid deal price for this product.");
          return;
        }
      } else {
        if (isTableBookingEnabled && slotTimes.length === 0) {
          toast.error("Please select at least one time slot for table reservation.");
          return;
        }
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!value || Number(value) <= 0) {
        toast.error("Please enter a valid discount value.");
        return;
      }
      if (!minBillAmount || Number(minBillAmount) <= 0) {
        toast.error("Please enter a valid minimum spend requirement.");
        return;
      }
      // If title is not set yet, auto-generate it before step 4
      if (!title.trim()) {
        handleGenerateTitle();
      }
      setCurrentStep(4);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle = title.trim() || `${type === "FLAT_PCT" ? `${value}% OFF` : `₹${value} OFF`} at ${selectedStore?.branchName || merchantDisplayName}`;

    const parseResult = offerCampaignSchema.safeParse({
      title: finalTitle,
      tagline: tagline.trim(),
      type,
      value: Number(value),
      maxDiscount: type === "FLAT_PCT" ? Number(maxDiscount) : undefined,
      minBillAmount: Number(minBillAmount),
      perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
      maxTotalRedemptions: maxTotalRedemptions ? Number(maxTotalRedemptions) : undefined,
      storeScope: selectedStoreId === "all" ? "ALL" : "SPECIFIC",
      applicableStoreIds: selectedStoreId === "all" ? [] : [selectedStoreId],
      validFrom,
      validTo,
      activeDays,
      startTime: enableHappyHours ? startTime : undefined,
      endTime: enableHappyHours ? endTime : undefined,
      redemptionMethod,
      promoCode: redemptionMethod === "PROMO_CODE" ? promoCode.trim().toUpperCase() : undefined,
      imageUrl: imageUrl.trim(),
      terms: terms.trim(),
      scopeType: offerScope === "STORE_PRODUCT" ? "PRODUCT" : "SERVICE",
      productCategory: offerScope === "STORE_PRODUCT" ? productCategory : undefined,
      originalPrice: offerScope === "STORE_PRODUCT" && originalPrice ? Number(originalPrice) : undefined,
      dealPrice: offerScope === "STORE_PRODUCT" && dealPrice ? Number(dealPrice) : undefined,
      isFlashDeal: offerScope === "STORE_PRODUCT" ? isFlashDeal : false,
      flashEndTime: offerScope === "STORE_PRODUCT" && isFlashDeal ? flashEndTime : undefined,
      totalFlashUnits: offerScope === "STORE_PRODUCT" && isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
      bonusCoins: Number(bonusCoins),
      badgeText: badgeText.trim() || undefined,
      ctaText: ctaText.trim() || (offerScope === "STORE_PRODUCT" ? "Add to Cart" : isTableBookingEnabled ? "Reserve Table" : "Book & Pay"),
      isTableBookingEnabled: offerScope === "STORE_OFFER" ? isTableBookingEnabled : false,
      bookingType: offerScope === "STORE_OFFER" ? bookingType : undefined,
      slotTimes: offerScope === "STORE_OFFER" && isTableBookingEnabled ? slotTimes : undefined,
      minPartySize: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(minPartySize) : undefined,
      maxPartySize: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(maxPartySize) : undefined,
      availableTablesPerSlot: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(availableTablesPerSlot) : undefined,
      seatingAreas: offerScope === "STORE_OFFER" && isTableBookingEnabled ? seatingAreas : undefined,
      coverChargeAmount: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(coverChargeAmount) : undefined,
      gracePeriodMinutes: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(gracePeriodMinutes) : undefined,
      instantConfirmation: offerScope === "STORE_OFFER" && isTableBookingEnabled ? instantConfirmation : undefined,
    });

    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(parseResult.error.issues[0]?.message || "Please fix validation errors");
      return;
    }

    setErrors({});
    const resolvedStoreId = (selectedStoreId && selectedStoreId !== "all") 
      ? selectedStoreId 
      : (availableStoresForMerchant[0]?.id || selectedStoreId);

    try {
      await onSave({
        merchantId: selectedMerchantId,
        merchantName: merchantDisplayName,
        storeId: resolvedStoreId,
        storeName: selectedStore?.branchName || selectedStore?.storeName || availableStoresForMerchant[0]?.branchName || "Branch Outlet",
        applicableStoreIds: [resolvedStoreId],
        title: finalTitle,
        tagline: tagline.trim(),
        type,
        value: Number(value),
        maxDiscount: type === "FLAT_PCT" ? Number(maxDiscount) : undefined,
        minBillAmount: Number(minBillAmount),
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
        maxTotalRedemptions: maxTotalRedemptions ? Number(maxTotalRedemptions) : undefined,
        validFrom,
        validTo,
        activeDays,
        startTime: enableHappyHours ? startTime : undefined,
        endTime: enableHappyHours ? endTime : undefined,
        redemptionMethod,
        promoCode: redemptionMethod === "PROMO_CODE" ? promoCode.trim().toUpperCase() : undefined,
        imageUrl: imageUrl.trim(),
        terms: terms.trim(),
        status: "ACTIVE",
        scopeType: offerScope === "STORE_PRODUCT" ? "PRODUCT" : "SERVICE",
        productCategory: offerScope === "STORE_PRODUCT" ? productCategory : undefined,
        originalPrice: offerScope === "STORE_PRODUCT" && originalPrice ? Number(originalPrice) : undefined,
        dealPrice: offerScope === "STORE_PRODUCT" && dealPrice ? Number(dealPrice) : undefined,
        isFlashDeal: offerScope === "STORE_PRODUCT" ? isFlashDeal : false,
        flashEndTime: offerScope === "STORE_PRODUCT" && isFlashDeal ? flashEndTime : undefined,
        totalFlashUnits: offerScope === "STORE_PRODUCT" && isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
        bonusCoins: Number(bonusCoins),
        badgeText: badgeText.trim() || undefined,
        ctaText: ctaText.trim() || (offerScope === "STORE_PRODUCT" ? "Add to Cart" : isTableBookingEnabled ? "Reserve Table" : "Book & Pay"),
        isTableBookingEnabled: offerScope === "STORE_OFFER" ? isTableBookingEnabled : false,
        bookingType: offerScope === "STORE_OFFER" ? bookingType : undefined,
        slotTimes: offerScope === "STORE_OFFER" && isTableBookingEnabled ? slotTimes : undefined,
        minPartySize: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(minPartySize) : undefined,
        maxPartySize: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(maxPartySize) : undefined,
        availableTablesPerSlot: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(availableTablesPerSlot) : undefined,
        seatingAreas: offerScope === "STORE_OFFER" && isTableBookingEnabled ? seatingAreas : undefined,
        coverChargeAmount: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(coverChargeAmount) : undefined,
        gracePeriodMinutes: offerScope === "STORE_OFFER" && isTableBookingEnabled ? Number(gracePeriodMinutes) : undefined,
        instantConfirmation: offerScope === "STORE_OFFER" && isTableBookingEnabled ? instantConfirmation : undefined,
      });

      onClose();
    } catch {
      // Backend error already displayed via toast; keep form open for correction
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-slate-800">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                <TicketPercent size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {isEdit ? "Edit Campaign Offer" : "Create Store Offer & Table Booking"}
                </h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="text-pink-600 font-bold">{merchantDisplayName}</span>
                  <span>•</span>
                  <span>{selectedStore ? selectedStore.branchName : "All Outlets"}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, title: "1. Merchant & Store" },
                { step: 2, title: "2. Offer Target" },
                { step: 3, title: "3. Rules & Pricing" },
                { step: 4, title: "4. Preview & Publish" }
              ].map(({ step, title: sTitle }) => {
                const isActive = currentStep === step;
                const isPassed = currentStep > step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (isPassed || step === 1) setCurrentStep(step as 1 | 2 | 3 | 4);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer",
                      isActive
                        ? "bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800"
                        : isPassed
                        ? "bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        : "opacity-50 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        isActive
                          ? "bg-pink-600 text-white"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      )}
                    >
                      {isPassed ? <Check size={11} /> : step}
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-bold truncate hidden sm:inline",
                        isActive
                          ? "text-pink-600 dark:text-pink-400"
                          : isPassed
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-slate-400"
                      )}
                    >
                      {sTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
            {/* ========================================================================= */}
            {/* STEP 1: SELECT MERCHANT & SELECT STORE */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* 1. Select Merchant Brand */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <Building2 size={14} className="text-pink-600" />
                      <span>Select Merchant Brand *</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Step 1 of 2 in Store Targeting</span>
                  </div>

                  <select
                    value={selectedMerchantId}
                    onChange={(e) => setSelectedMerchantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold shadow-2xs focus:ring-1 focus:ring-pink-500"
                  >
                    {merchants.length === 0 ? (
                      <option value="">No Merchants Available</option>
                    ) : (
                      merchants.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.businessName} • {m.categoryName || "General"} ({m.city || "Headquarters"})
                        </option>
                      ))
                    )}
                  </select>

                  {selectedMerchant && (
                    <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          {selectedMerchant.businessName}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Owner: {selectedMerchant.ownerName} • {selectedMerchant.city}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {selectedMerchant.categoryName || "Merchant"}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Select Store / Branch for this Merchant */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <StoreIcon size={14} className="text-pink-600" />
                      <span>Select Target Store Branch *</span>
                    </label>
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md">
                      {availableStoresForMerchant.length} Branches Available
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Choose which physical store branch this campaign will be deployed to, or apply to all branches.
                  </p>

                  <div className="space-y-2">
                    {/* All Outlets Option */}
                    <label
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                        selectedStoreId === "all"
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="storeBranchOption"
                        checked={selectedStoreId === "all"}
                        onChange={() => setSelectedStoreId("all")}
                        className="mt-1 w-4 h-4 accent-pink-600 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">
                          All Brand Outlets (Chain-Wide Deal)
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Applies across all {availableStoresForMerchant.length} branch locations of {merchantDisplayName}
                        </span>
                      </div>
                    </label>

                    {/* Specific Store Branch Cards */}
                    {availableStoresForMerchant.map((s) => {
                      const isSelected = selectedStoreId === s.id;
                      return (
                        <label
                          key={s.id}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          )}
                        >
                          <input
                            type="radio"
                            name="storeBranchOption"
                            checked={isSelected}
                            onChange={() => setSelectedStoreId(s.id)}
                            className="mt-1 w-4 h-4 accent-pink-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">
                                {s.branchName}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                                {s.city}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin size={10} className="shrink-0 text-pink-600" />
                                <span className="truncate">{s.address}</span>
                              </span>
                              {s.phone && (
                                <span className="flex items-center gap-1 shrink-0">
                                  <Phone size={10} className="shrink-0" />
                                  <span>{s.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}

                    {availableStoresForMerchant.length === 0 && (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                        <AlertCircle size={16} className="shrink-0" />
                        <div>
                          <p className="font-bold">No individual store branches found for this merchant.</p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Campaign will be set as brand-wide. You can also add stores in the Store Management tab.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: OFFER TARGET (STORE EXPERIENCE vs STORE PRODUCT) */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-2">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200 block text-xs">
                    Choose What You Are Offering for {selectedStore?.branchName || merchantDisplayName} *
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Will this deal apply to the store's dine-in / table reservation / visit, or to a specific product sold in this store?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: Store Offer / Table Booking */}
                    <button
                      type="button"
                      onClick={() => {
                        setOfferScope("STORE_OFFER");
                        if (ctaText === "Add to Cart") setCtaText(isTableBookingEnabled ? "Reserve Table" : "Book & Pay");
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                        offerScope === "STORE_OFFER"
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <Utensils size={20} />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          Store-Level Deal / Table Booking
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                          Bill discount on store visits, dining table reservation slots, salon chairs, service bays.
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Store Product Deal */}
                    <button
                      type="button"
                      onClick={() => {
                        setOfferScope("STORE_PRODUCT");
                        setIsTableBookingEnabled(false);
                        if (ctaText === "Reserve Table" || ctaText === "Book & Pay") setCtaText("Add to Cart");
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                        offerScope === "STORE_PRODUCT"
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 ring-1 ring-pink-500/40 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          Store Product Item Deal
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-snug">
                          Bargain discount on a specific product item (e.g. Atta combo, Milk, Earbuds, Tees, Protein).
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-Section 1: Store Table & Slot Reservation Engine (When STORE_OFFER) */}
                {offerScope === "STORE_OFFER" && (
                  <div className="p-4 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                          <Armchair size={16} />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                            District-Style Table Reservation & Time Slots
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Allow consumers to book confirmed tables / appointment slots with deal discount
                          </span>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isTableBookingEnabled}
                          onChange={(e) => setIsTableBookingEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {isTableBookingEnabled && (
                      <div className="space-y-4 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                        {/* Booking Vertical Mode */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setBookingType("TABLE_RESERVATION");
                              setCtaText("Reserve Table");
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                              bookingType === "TABLE_RESERVATION"
                                ? "border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-500"
                            )}
                          >
                            <Utensils size={14} />
                            <span>Dining Table Booking</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBookingType("APPOINTMENT_SLOT");
                              setCtaText("Book Slot");
                            }}
                            className={cn(
                              "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                              bookingType === "APPOINTMENT_SLOT"
                                ? "border-indigo-600 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                : "border-slate-200 dark:border-slate-800 text-slate-500"
                            )}
                          >
                            <Clock size={14} />
                            <span>Service Appointment Slot</span>
                          </button>
                        </div>

                        {/* Available Time Slots with Quick Click Pills */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Clock size={12} className="text-indigo-600" />
                              <span>Live Time Slots at Store ({slotTimes.length} active)</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSlotTimes(["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM"])}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                              >
                                ☀️ Lunch
                              </button>
                              <button
                                type="button"
                                onClick={() => setSlotTimes(["07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM"])}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                              >
                                🌙 Dinner
                              </button>
                              <button
                                type="button"
                                onClick={() => setSlotTimes(STANDARD_SLOTS)}
                                className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 hover:bg-slate-200 cursor-pointer"
                              >
                                ⚡ All
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_SLOTS.map((slot) => {
                              const isSelected = slotTimes.includes(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => toggleSlot(slot)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-indigo-600 text-white font-bold shadow-2xs"
                                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                  )}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>

                          {/* Add Custom Slot */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={newSlotInput}
                              onChange={(e) => setNewSlotInput(e.target.value)}
                              placeholder="Add custom slot e.g. 03:00 PM"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={addCustomSlot}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {/* Party Size & Tables Per Slot */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Min Guests
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={minPartySize}
                              onChange={(e) => setMinPartySize(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Max Guests
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={maxPartySize}
                              onChange={(e) => setMaxPartySize(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                              Tables Per Slot
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={availableTablesPerSlot}
                              onChange={(e) => setAvailableTablesPerSlot(Number(e.target.value))}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold font-mono mt-1"
                            />
                          </div>
                        </div>

                        {/* Seating Areas */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            Allowed Seating Sections:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {SEATING_AREA_OPTIONS.map((area) => {
                              const isSelected = seatingAreas.includes(area);
                              return (
                                <button
                                  key={area}
                                  type="button"
                                  onClick={() => toggleSeatingArea(area)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                                    isSelected
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold"
                                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                                  )}
                                >
                                  {isSelected && <Check size={11} />}
                                  <span>{area}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Cover charge & grace period */}
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cover / Deposit</span>
                            <select
                              value={coverChargeAmount}
                              onChange={(e) => setCoverChargeAmount(Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value={0}>Free (₹0)</option>
                              <option value={100}>₹100 (Adjusted in Bill)</option>
                              <option value={200}>₹200 (Adjusted in Bill)</option>
                              <option value={500}>₹500 (Cover Deposit)</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Holding Grace</span>
                            <select
                              value={gracePeriodMinutes}
                              onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value={10}>10 Mins</option>
                              <option value={15}>15 Mins (Standard)</option>
                              <option value={20}>20 Mins</option>
                              <option value={30}>30 Mins</option>
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Confirmation</span>
                            <select
                              value={instantConfirmation ? "INSTANT" : "MANUAL"}
                              onChange={(e) => setInstantConfirmation(e.target.value === "INSTANT")}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mt-0.5"
                            >
                              <option value="INSTANT">Instant Auto</option>
                              <option value="MANUAL">Manager Approval</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Section 2: Store Product Details (When STORE_PRODUCT) */}
                {offerScope === "STORE_PRODUCT" && (
                  <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                          Product Specifications for {selectedStore?.branchName || merchantDisplayName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Define the retail product, MRP, and special deal price
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                          Product Item Name *
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g. Amul Taaza Toned Milk (1 Litre Tetra Pak) or Atta 10kg Combo"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold mt-1"
                        />
                      </div>

                      {/* Product Department / Category Pills */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                          Product Department *
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRODUCT_CATEGORIES.map((cat) => {
                            const isSelected = productCategory === cat.key;
                            return (
                              <button
                                key={cat.key}
                                type="button"
                                onClick={() => setProductCategory(cat.key)}
                                className={cn(
                                  "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1",
                                  isSelected
                                    ? "bg-emerald-600 text-white font-bold shadow-2xs"
                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                                )}
                              >
                                <span>{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pricing: MRP vs Deal Price */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                            Original MRP (₹)
                          </label>
                          <input
                            type="number"
                            value={originalPrice ?? ""}
                            onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="e.g. 75"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                            Store Deal Price (₹) *
                          </label>
                          <input
                            type="number"
                            value={dealPrice ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : undefined;
                              setDealPrice(val);
                              if (val && originalPrice && originalPrice > val) {
                                setValue(Math.round(((originalPrice - val) / originalPrice) * 100));
                              }
                            }}
                            placeholder="e.g. 56"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold text-emerald-600"
                          />
                        </div>
                      </div>

                      {computedProductDiscountPct && (
                        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/60 border border-emerald-200/80 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Calculated Consumer Savings:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {computedProductDiscountPct}% Instant Discount
                          </span>
                        </div>
                      )}

                      {/* Flash Deal Countdown Toggle */}
                      <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                            Enable Flash Deal Countdown
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Shows urgency badge and live countdown timer in consumer app
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isFlashDeal}
                          onChange={(e) => setIsFlashDeal(e.target.checked)}
                          className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: DEAL RULES, PRICING & MARGIN SAFEGUARDS */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Discount Type Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Discount Structure *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "FLAT_PCT", label: "Percentage %", desc: "e.g. 40% OFF" },
                      { key: "FLAT_AMT", label: "Flat Amount ₹", desc: "e.g. ₹200 OFF" },
                      { key: "BOGO", label: "Buy 1 Get 1 (BOGO)", desc: "1+1 on Menu / Pass" }
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setType(m.key as any)}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                          type === m.key
                            ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        )}
                      >
                        <span className="block text-xs">{m.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Values & Limits Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      {type === "FLAT_PCT" ? "Discount Percentage (%) *" : "Discount Value (₹) *"}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Minimum Spend Requirement (₹) *
                    </label>
                    <input
                      type="number"
                      value={minBillAmount}
                      onChange={(e) => setMinBillAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono font-bold"
                    />
                  </div>
                </div>

                {type === "FLAT_PCT" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                        Maximum Discount Cap (₹)
                      </label>
                      <span className="text-[10px] text-slate-400">Protects store margin on large bills</span>
                    </div>
                    <input
                      type="number"
                      value={maxDiscount ?? ""}
                      onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 200 (Leave empty for no upper limit)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-mono"
                    />
                  </div>
                )}

                {/* Loyalty Bonus Coins */}
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-amber-600" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                        Loyalty Bonus Coins for Customers
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Coins credited to user wallet after this store deal is redeemed
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={bonusCoins}
                    onChange={(e) => setBonusCoins(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-right"
                  />
                </div>

                {/* Redemption Trigger (Auto-Applied vs Promo Code) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Redemption Trigger Mode *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRedemptionMethod("AUTO_APPLIED")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                        redemptionMethod === "AUTO_APPLIED"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      )}
                    >
                      <Zap size={14} className="mx-auto mb-1 text-pink-600" />
                      <span>Auto-Applied on Bill</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedemptionMethod("PROMO_CODE")}
                      className={cn(
                        "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                        redemptionMethod === "PROMO_CODE"
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold shadow-2xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-500"
                      )}
                    >
                      <Tag size={14} className="mx-auto mb-1 text-purple-600" />
                      <span>Requires Promo Code</span>
                    </button>
                  </div>

                  {redemptionMethod === "PROMO_CODE" && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g. DISTRICT40"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleGeneratePromo}
                        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Wand2 size={12} />
                        <span>Generate</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time Economics & Margin Safeguard Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Calculator size={14} className="text-pink-600" />
                      <span>Economics Breakdown for Store: {selectedStore?.branchName || merchantDisplayName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Sample Order: ₹{Math.max(minBillAmount, 1000)}</span>
                  </div>

                  {(() => {
                    const sampleSpend = Math.max(minBillAmount, 1000);
                    let sampleDiscount = 0;
                    if (type === "FLAT_PCT") {
                      sampleDiscount = (sampleSpend * value) / 100;
                      if (maxDiscount) sampleDiscount = Math.min(sampleDiscount, maxDiscount);
                    } else if (type === "FLAT_AMT") {
                      sampleDiscount = value;
                    } else {
                      sampleDiscount = Math.min(sampleSpend * 0.5, maxDiscount || sampleSpend * 0.5);
                    }
                    const customerPays = Math.max(0, sampleSpend - sampleDiscount);
                    return (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Customer Saves</span>
                          <span className="text-sm font-extrabold text-emerald-600 font-mono">₹{sampleDiscount.toFixed(0)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Store Receives</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">₹{customerPays.toFixed(0)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Loyalty Inflow</span>
                          <span className="text-sm font-extrabold text-amber-500 font-mono">+{bonusCoins} Coins</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: MERCHANDISING, LIVE MOBILE PREVIEW & PUBLISH */}
            {/* ========================================================================= */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Titles & Tagline with Auto-Generate Helper */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                        Campaign Title *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateTitle}
                        className="flex items-center gap-1 text-[10px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
                      >
                        <Wand2 size={11} />
                        <span>Auto-Generate from Store</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Flat 40% OFF Table Reservation @ Bandra West"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Mobile Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Savor multi-cuisine delicacies with instant bill discount"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Badge Text & Call To Action */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Deal Badge Text
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. DISTRICT SPECIAL"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-bold text-pink-600 uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Mobile CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Reserve Table / Add to Cart"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 font-bold"
                    />
                  </div>
                </div>

                {/* Dates & Schedule */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                      <Calendar size={13} className="text-pink-600" />
                      <span>Valid From *</span>
                    </label>
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                      <Calendar size={13} className="text-pink-600" />
                      <span>Valid To *</span>
                    </label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Days of Week */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Active Days
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                          activeDays.includes(day)
                            ? "bg-pink-600 text-white shadow-2xs font-bold"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Photo Gallery */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <ImageIcon size={13} className="text-pink-600" />
                      <span>Choose Banner Photo (1-Click Select)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">High-Resolution HD</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(offerScope === "STORE_PRODUCT" ? CURATED_IMAGES.STORE_PRODUCT : CURATED_IMAGES.STORE_DINING).map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setImageUrl(img.url);
                          toast.success(`Selected banner: ${img.label}`);
                        }}
                        className={cn(
                          "relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer group",
                          imageUrl === img.url
                            ? "border-pink-600 ring-2 ring-pink-500/30 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 hover:border-pink-400"
                        )}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 truncate text-center">
                          {img.label}
                        </span>
                        {imageUrl === img.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Terms & Fine Print
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateTerms}
                      className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                    >
                      <Wand2 size={11} />
                      <span>Auto-Generate Store T&C</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* LIVE CONSUMER MOBILE SCREEN PREVIEW */}
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Eye size={13} className="text-pink-600" />
                      <span>Live Consumer Mobile Card Preview</span>
                    </span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 dark:bg-pink-950 px-2 py-0.5 rounded-md">
                      {selectedStore ? selectedStore.branchName : "All Outlets"}
                    </span>
                  </div>

                  <div className="max-w-sm mx-auto bg-white dark:bg-[#121626] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                    {/* Visual Card Image */}
                    <div className="relative aspect-video w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon size={32} />
                        </div>
                      )}
                      {badgeText && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-pink-600 text-white shadow-md">
                          {badgeText}
                        </span>
                      )}
                      {offerScope === "STORE_OFFER" && isTableBookingEnabled && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase bg-emerald-600 text-white shadow-md flex items-center gap-1">
                          <Armchair size={10} className="fill-white" />
                          <span>Confirmed Table</span>
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                          {merchantDisplayName} • {selectedStore?.branchName || "All Outlets"}
                        </span>
                        <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-0.5">
                          <Coins size={11} />
                          <span>+{bonusCoins} Coins</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-1">
                          {title || "Campaign Offer Title"}
                        </h4>
                        {tagline && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                            "{tagline}"
                          </p>
                        )}
                      </div>

                      {/* District Table Slots Preview Widget */}
                      {offerScope === "STORE_OFFER" && isTableBookingEnabled && slotTimes.length > 0 && (
                        <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                              <Clock size={11} className="text-indigo-600" />
                              <span>Select Time Slot ({type === "FLAT_PCT" ? `${value}% OFF` : `₹${value} OFF`})</span>
                            </span>
                            <span className="text-indigo-600 font-bold">{minPartySize}-{maxPartySize} Guests</span>
                          </div>

                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {slotTimes.slice(0, 4).map((slot, idx) => (
                              <span
                                key={slot}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0",
                                  idx === 0
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                )}
                              >
                                {slot}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-indigo-200/40">
                            <span>{seatingAreas[0] || "Indoor Dining"}</span>
                            <span>{gracePeriodMinutes}m grace period</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          {offerScope === "STORE_PRODUCT" && dealPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-black text-emerald-600 font-mono">
                                ₹{dealPrice}
                              </span>
                              {originalPrice && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{originalPrice}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-base font-black text-pink-600 font-mono">
                              {type === "FLAT_AMT"
                                ? `₹${value} FLAT`
                                : type === "FLAT_PCT"
                                ? `${value}% OFF`
                                : "BOGO"}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block">
                            Min spend ₹{minBillAmount}
                          </span>
                        </div>

                        <span className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-xs">
                          {ctaText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Stepper Footer Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Step {currentStep} of 4
              </span>
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-gradient flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-gradient flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Publish Offer to Store</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
