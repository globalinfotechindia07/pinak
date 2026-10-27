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
  Upload,
  Trash2,
  ListChecks,
  FileText,
  CheckCircle2,
  Info,
  Sliders,
  DollarSign,
  ShieldCheck,
  Bookmark
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
    { label: "Amul Fresh Milk", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDs3waAQbgzW6ulcWgCbnSxbpZN_13ZJXWzm4X2qAl0vMuum2WR04QFvNkO8dtZdx7jm6Hx-4Yv-UOTJvm_T1_zP-BjcNgu-n36fI1NJbiNiDN6iATJvnTI3PZFH9s3mrPOOkbC6anaq1aeOnanPe9Jc7mJ3mhPvignPOty3w2-rM7g19DmmRog4WK1HSwTg6I3iNANpsvacjgVB8XlD2SaJ5lauRM86etGCZnk70_yZwEM-f1ui0Vd" },
    { label: "Basmati Rice", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAz3pTi8RkZpVw-Mr8tM5TAVW9Dl52lt8OT816AYoIq9TJciz5RZiVqam6VcVx6sW0eHkx1AIsMU_2cJQnOVUCV_IsPb5ebrpge7RJgrt7_UolSuNwhci2MERrxPmWqzsSDf9lIz1ejVVwqN1p2Tqt7z2H8zJcBLccInJxlWFHuXUO9pdnl62dGbzHOHafQcu5_8dty0RVNA6-oxEzRekQ_W5lhkTuggAod0xEPnSZqWT2hebkFAl3V" },
    { label: "Maggi Noodles", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD85STcU1nutJDJ0krl4bTkoIPmaJ4PD8EjDXxLt-3Wn97ov26ZRK_SgQz8XHHhygaSlXOwxm0aLDFgmOu9U2WwN_95PeXogGINTBsN7dXzUQy2oBGxucmNu9hQEbQmEHzwp5jNKXMetSnvoYnYlLJefb5wPnXog5WI-ZbK496lXs2rlF6L_D7_gM36Sat4HKXCWbX4zLOgCJftTO1Y9PBzQcX7uXfvPaYD0tsmT6Klx91ng021rARr" },
    { label: "Grocery Essentials", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" }
  ]
};

const PRESET_DISCOUNTS = [
  { label: "15% OFF", type: "FLAT_PCT" as const, val: 15, minBill: 400, maxDisc: 150 },
  { label: "20% OFF", type: "FLAT_PCT" as const, val: 20, minBill: 500, maxDisc: 200 },
  { label: "30% OFF", type: "FLAT_PCT" as const, val: 30, minBill: 750, maxDisc: 300 },
  { label: "50% OFF", type: "FLAT_PCT" as const, val: 50, minBill: 1000, maxDisc: 500 },
  { label: "₹100 Flat", type: "FLAT_AMT" as const, val: 100, minBill: 500, maxDisc: 100 },
  { label: "Buy 1 Get 1 Free", type: "BOGO" as const, val: 50, minBill: 600, maxDisc: 300 },
  { label: "15% Cashback", type: "CASHBACK" as const, val: 15, minBill: 500, maxDisc: 250 }
];

const PRESET_TERMS = [
  "Valid for Dine-in only at participating brand outlets",
  "Valid on Pre-booked table reservations only",
  "Cannot be clubbed with other offers, card deals, or combos",
  "Valid on total bill including food and soft beverages",
  "Not applicable on alcoholic beverages and tobacco products",
  "One voucher redeemable per table / bill",
  "Taxes and applicable government service charges extra",
  "Prior reservation / pre-booking recommended during peak rush hours",
  "Table held for up to 15 minutes past scheduled slot time",
  "Must present voucher / bill code prior to final billing",
  "Valid across all participating brand outlets",
  "Valid only during specified operating days and hours"
];

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
  // Logical 3-Step Streamlined Sequence:
  // Step 1: Offer Essentials & Store (Who, Target, Title & Visual)
  // Step 2: Deal, Pricing & Validity (Discount, Slots, Dates, Schedule)
  // Step 3: Terms & Fine Print + Preview & Publish (Terms Manager, Live Preview & Publish)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // OFFER TARGET FORMAT
  // "PRE_BOOK" = Pre-booking Table Reservation
  // "WALK_IN" = Instant Walk-in Bill Discount
  // "STORE_PRODUCT" = Specific retail product bargain
  const [offerScope, setOfferScope] = useState<"PRE_BOOK" | "WALK_IN" | "STORE_PRODUCT">(
    initialData?.scopeType === "PRODUCT"
      ? "STORE_PRODUCT"
      : initialData?.isTableBookingEnabled
      ? "PRE_BOOK"
      : "WALK_IN"
  );

  // Offer Titles & Visuals
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [tagline, setTagline] = useState<string>(initialData?.tagline || "");
  const [badgeText, setBadgeText] = useState<string>(
    initialData?.badgeText || (offerScope === "STORE_PRODUCT" ? "STORE FLASH" : "PINAK EXCLUSIVE")
  );
  const [ctaText, setCtaText] = useState<string>(
    initialData?.ctaText || (offerScope === "STORE_PRODUCT" ? "Add to Cart" : offerScope === "PRE_BOOK" ? "Reserve Table" : "Book & Pay")
  );
  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80"
  );

  // STEP 2: DEAL RULES & PRICING
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO" | "CASHBACK">(
    (initialData?.type as any) || "FLAT_PCT"
  );
  const [value, setValue] = useState<number>(initialData?.value ?? 50);
  const [minBillAmount, setMinBillAmount] = useState<number>(initialData?.minBillAmount ?? 1000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(initialData?.maxDiscount ?? 500);
  const [bonusCoins, setBonusCoins] = useState<number>(initialData?.bonusCoins ?? 100);
  const [perUserLimit, setPerUserLimit] = useState<number | undefined>(initialData?.perUserLimit ?? 1);
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState<number | undefined>(
    initialData?.maxTotalRedemptions ?? 500
  );
  const [buyQuantity, setBuyQuantity] = useState<number>(initialData?.buyQuantity ?? 1);
  const [getQuantity, setGetQuantity] = useState<number>(initialData?.getQuantity ?? 1);

  const [redemptionMethod, setRedemptionMethod] = useState<"AUTO_APPLIED" | "PROMO_CODE">(
    initialData?.redemptionMethod || "AUTO_APPLIED"
  );
  const [promoCode, setPromoCode] = useState<string>(initialData?.promoCode || "PINAK50");

  // Pre-booking specific settings
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
  const [newSlotInput, setNewSlotInput] = useState<string>("");

  // Product specific settings
  const [productName, setProductName] = useState<string>(
    initialData?.scopeType === "PRODUCT" ? initialData.title || "" : ""
  );
  const [unitOrWeight, setUnitOrWeight] = useState<string>(
    initialData?.unitOrWeight || ""
  );
  const [productCategory, setProductCategory] = useState<string>(
    initialData?.productCategory || "GROCERY"
  );
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(initialData?.originalPrice);
  const [dealPrice, setDealPrice] = useState<number | undefined>(initialData?.dealPrice);
  const [isFlashDeal, setIsFlashDeal] = useState<boolean>(initialData?.isFlashDeal || false);
  const [totalFlashUnits, setTotalFlashUnits] = useState<number | undefined>(initialData?.totalFlashUnits ?? 50);

  // Validity Dates & Schedule
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

  // STEP 3: TERMS & FINE PRINT
  const [termsList, setTermsList] = useState<string[]>(() => {
    if (initialData?.terms && initialData.terms.trim()) {
      return initialData.terms
        .split(/\n|•/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);
    }
    return [
      "Valid for Dine-in only at participating brand outlets",
      "Available on Mon-Sun • Valid on minimum bill ₹1,000",
      "Cannot be clubbed with existing in-store promotions or corporate cards",
      "Auto-applied at checkout on PINAK bill payment"
    ];
  });
  const [customTermInput, setCustomTermInput] = useState<string>("");
  const [showRawTerms, setShowRawTerms] = useState<boolean>(false);
  const [rawTermsText, setRawTermsText] = useState<string>("");
  const [isPreviewTermsOpen, setIsPreviewTermsOpen] = useState<boolean>(false);

  // Sync termsList to raw text when termsList changes
  useEffect(() => {
    setRawTermsText(termsList.map((t) => `• ${t}`).join("\n"));
  }, [termsList]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-calculated discount % for product deals
  const computedProductDiscountPct = useMemo(() => {
    if (originalPrice && dealPrice && originalPrice > dealPrice) {
      return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
    }
    return null;
  }, [originalPrice, dealPrice]);

  // Set default title if empty when switching store or discount
  useEffect(() => {
    if (!title && !isEdit) {
      const storeLabel = selectedStore ? selectedStore.branchName : "All Branches";
      if (offerScope === "STORE_PRODUCT") {
        setTitle(`Special Store Deal @ ${storeLabel}`);
      } else {
        const disc = type === "FLAT_PCT" ? `${value}% OFF` : `₹${value} OFF`;
        const exp = offerScope === "PRE_BOOK" ? "on Pre-Booking & Bill" : "on Total Bill";
        setTitle(`Flat ${disc} ${exp}`);
        setTagline(`Available on Mon-Sun • Valid on minimum bill ₹${minBillAmount}`);
      }
    }
  }, [offerScope, selectedStore, type, value, minBillAmount, isEdit]);

  // Toggle Day of Week
  const handleToggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );
  };

  // Fast Validity Presets (+7, +14, +30, +90 days)
  const handleSetDurationDays = (days: number) => {
    const from = new Date(validFrom || Date.now());
    const to = new Date(from.getTime() + days * 86400000);
    setValidTo(to.toISOString().split("T")[0]);
    toast.success(`Validity extended by ${days} days!`);
  };

  // 1-Click Auto Title Generator
  const handleGenerateTitle = () => {
    const storeLabel = selectedStore ? selectedStore.branchName : "All Branches";
    if (offerScope === "STORE_PRODUCT") {
      const pName = productName.trim() || "Retail Item";
      const prodDisc = computedProductDiscountPct ? `${computedProductDiscountPct}% OFF` : `Special Deal`;
      setTitle(`${pName} (${prodDisc}) @ ${storeLabel}`);
      setTagline(`Special retail store bargain • Limited express counter stock`);
    } else {
      const disc = type === "FLAT_PCT"
        ? `${value}% off`
        : type === "FLAT_AMT"
        ? `Flat ₹${value} off`
        : type === "CASHBACK"
        ? `${value}% Cashback`
        : `Buy ${buyQuantity} Get ${getQuantity} Free`;
      const exp = offerScope === "PRE_BOOK" ? "on Table Pre-Booking" : "on Total Bill";
      setTitle(type === "BOGO" ? `${disc} ${exp}` : `Flat ${disc} ${exp}`);
      setTagline(`Available on ${activeDays.length === 7 ? "Mon-Sun" : activeDays.join(", ")} • Valid on minimum bill ₹${minBillAmount}`);
    }
    toast.success("Generated clean title & tagline!");
  };

  // 1-Click Auto Terms Generator (populates structured bullets)
  const handleGenerateTerms = () => {
    const storeLabel = selectedStore ? selectedStore.branchName : "all participating brand outlets";
    const newItems: string[] = [];

    newItems.push(`Offer valid exclusively at ${merchantDisplayName} (${storeLabel}).`);

    if (offerScope === "PRE_BOOK") {
      newItems.push(`Table held up to ${gracePeriodMinutes} minutes from booked reservation arrival.`);
      newItems.push(`Applicable for party size of ${minPartySize} to ${maxPartySize} guests.`);
      if (coverChargeAmount > 0) {
        newItems.push(`Cover charge deposit of ₹${coverChargeAmount} will be adjusted against the final bill.`);
      }
    } else if (offerScope === "WALK_IN") {
      newItems.push(`Valid on walk-in dining and instant billing.`);
    } else {
      newItems.push(`Product must be collected at store express billing counter.`);
      if (isFlashDeal && totalFlashUnits) {
        newItems.push(`Limited flash stock of ${totalFlashUnits} units per customer.`);
      }
    }

    if (type === "FLAT_PCT") {
      newItems.push(`Discount of ${value}% applied up to maximum ₹${maxDiscount || 500} on bills of ₹${minBillAmount} & above.`);
    } else if (type === "FLAT_AMT") {
      newItems.push(`Flat discount of ₹${value} applied on minimum bill of ₹${minBillAmount}.`);
    } else {
      newItems.push(`Buy 1 Get 1 free applicable on item of equal or lesser value.`);
    }

    newItems.push(`Cannot be clubbed with other existing in-store promotions, combos, or corporate cards.`);
    newItems.push(`Taxes and government service charges applicable extra as per invoice.`);

    setTermsList(newItems);
    toast.success("Generated tailored terms and conditions bullets!");
  };

  // Add individual custom term
  const handleAddCustomTerm = () => {
    const trimmed = customTermInput.trim();
    if (!trimmed) return;
    if (termsList.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This term is already included.");
      return;
    }
    setTermsList((prev) => [...prev, trimmed]);
    setCustomTermInput("");
    toast.success("Added custom condition to terms!");
  };

  // Remove term
  const handleRemoveTerm = (index: number) => {
    setTermsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle Preset Term Chip
  const handleTogglePresetTerm = (presetText: string) => {
    if (termsList.some((t) => t.toLowerCase() === presetText.toLowerCase())) {
      setTermsList((prev) => prev.filter((t) => t.toLowerCase() !== presetText.toLowerCase()));
    } else {
      setTermsList((prev) => [...prev, presetText]);
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedMerchantId) {
        toast.error("Please select a merchant brand.");
        return;
      }
      if (availableStoresForMerchant.length === 0) {
        toast.error("This merchant has no registered stores. Please create a store branch first.");
        return;
      }
      if (!title.trim()) {
        handleGenerateTitle();
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!value || Number(value) <= 0) {
        toast.error("Please enter a valid discount value.");
        return;
      }
      if (!minBillAmount || Number(minBillAmount) <= 0) {
        toast.error("Please enter a valid minimum spend requirement.");
        return;
      }
      if (offerScope === "PRE_BOOK" && slotTimes.length === 0) {
        toast.error("Please select at least one time slot for pre-booking.");
        return;
      }
      if (offerScope === "STORE_PRODUCT" && !productName.trim()) {
        toast.error("Please enter the product name sold at this store.");
        return;
      }
      if (!validTo) {
        toast.error("Please select a campaign end date.");
        return;
      }
      setCurrentStep(3);
    }
  };

  // Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const isProduct = offerScope === "STORE_PRODUCT";
    const finalTitle = title.trim() || `${type === "FLAT_PCT" ? `${value}% OFF` : type === "FLAT_AMT" ? `Flat ₹${value} OFF` : type === "CASHBACK" ? `${value}% Cashback` : `Buy ${buyQuantity} Get ${getQuantity} Free`} at ${selectedStore?.branchName || merchantDisplayName}`;
    const autoProductDiscount = isProduct && originalPrice && dealPrice && originalPrice > dealPrice
      ? (type === "FLAT_PCT" ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : (originalPrice - dealPrice))
      : Number(value);
    const resolvedValue = autoProductDiscount > 0 ? autoProductDiscount : (Number(value) || 20);
    const resolvedMaxDiscount = (type === "FLAT_PCT" || type === "CASHBACK" || type === "BOGO")
      ? (maxDiscount ? Number(maxDiscount) : 500)
      : undefined;
    const resolvedMinBill = Number(minBillAmount || 500);

    const compiledTerms = showRawTerms
      ? rawTermsText.trim()
      : termsList.map((t) => `• ${t}`).join("\n");

    const parseResult = offerCampaignSchema.safeParse({
      title: finalTitle,
      tagline: tagline.trim() || `Available on Mon-Sun • Valid on minimum bill ₹${resolvedMinBill}`,
      type,
      value: resolvedValue,
      maxDiscount: resolvedMaxDiscount,
      minBillAmount: resolvedMinBill,
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
      redemptionType: offerScope === "PRE_BOOK" ? "PRE_BOOK" : offerScope === "WALK_IN" ? "WALK_IN" : "BOTH",
      minAdvanceHours: offerScope === "PRE_BOOK" ? 2 : 0,
      imageUrl: imageUrl.trim(),
      terms: compiledTerms,
      scopeType: isProduct ? "PRODUCT" : "SERVICE",
      productCategory: isProduct ? productCategory : undefined,
      originalPrice: isProduct && originalPrice ? Number(originalPrice) : undefined,
      dealPrice: isProduct && dealPrice ? Number(dealPrice) : undefined,
      isFlashDeal: isProduct ? isFlashDeal : false,
      totalFlashUnits: isProduct && isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
      bonusCoins: Number(bonusCoins),
      badgeText: badgeText.trim() || "PINAK EXCLUSIVE",
      ctaText: ctaText.trim() || (isProduct ? "Add to Cart" : offerScope === "PRE_BOOK" ? "Reserve Table" : "Book & Pay"),
      buyQuantity: type === "BOGO" ? Number(buyQuantity || 1) : undefined,
      getQuantity: type === "BOGO" ? Number(getQuantity || 1) : undefined,
      isTableBookingEnabled: offerScope === "PRE_BOOK",
      bookingType: offerScope === "PRE_BOOK" ? "TABLE_RESERVATION" : undefined,
      slotTimes: offerScope === "PRE_BOOK" ? slotTimes : undefined,
      minPartySize: offerScope === "PRE_BOOK" ? Number(minPartySize) : undefined,
      maxPartySize: offerScope === "PRE_BOOK" ? Number(maxPartySize) : undefined,
      availableTablesPerSlot: offerScope === "PRE_BOOK" ? Number(availableTablesPerSlot) : undefined,
      seatingAreas: offerScope === "PRE_BOOK" ? seatingAreas : undefined,
      coverChargeAmount: offerScope === "PRE_BOOK" ? Number(coverChargeAmount) : undefined,
      gracePeriodMinutes: offerScope === "PRE_BOOK" ? Number(gracePeriodMinutes) : undefined,
      instantConfirmation: true,
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
    const isChainWide = selectedStoreId === "all";
    const resolvedStoreId = isChainWide ? undefined : selectedStoreId;

    try {
      await onSave({
        merchantId: selectedMerchantId,
        merchantName: merchantDisplayName,
        storeId: resolvedStoreId,
        storeName: isChainWide ? "All Brand Outlets" : (selectedStore?.branchName || selectedStore?.storeName || "Branch Outlet"),
        applicableStoreIds: isChainWide ? [] : (resolvedStoreId ? [resolvedStoreId] : []),
        title: finalTitle,
        tagline: tagline.trim() || `Available on Mon-Sun • Valid on minimum bill ₹${resolvedMinBill}`,
        unitOrWeight: isProduct && unitOrWeight ? unitOrWeight.trim() : undefined,
        type,
        value: resolvedValue,
        buyQuantity: type === "BOGO" ? Number(buyQuantity || 1) : undefined,
        getQuantity: type === "BOGO" ? Number(getQuantity || 1) : undefined,
        maxDiscount: resolvedMaxDiscount,
        minBillAmount: resolvedMinBill,
        perUserLimit: perUserLimit ? Number(perUserLimit) : undefined,
        maxTotalRedemptions: maxTotalRedemptions ? Number(maxTotalRedemptions) : undefined,
        validFrom,
        validTo,
        activeDays,
        startTime: enableHappyHours ? startTime : undefined,
        endTime: enableHappyHours ? endTime : undefined,
        redemptionMethod,
        promoCode: redemptionMethod === "PROMO_CODE" ? promoCode.trim().toUpperCase() : undefined,
        redemptionType: offerScope === "PRE_BOOK" ? "PRE_BOOK" : offerScope === "WALK_IN" ? "WALK_IN" : "BOTH",
        minAdvanceHours: offerScope === "PRE_BOOK" ? 2 : 0,
        imageUrl: imageUrl.trim(),
        terms: compiledTerms,
        status: "ACTIVE",
        scopeType: isProduct ? "PRODUCT" : "SERVICE",
        productCategory: isProduct ? productCategory : undefined,
        originalPrice: isProduct && originalPrice ? Number(originalPrice) : undefined,
        dealPrice: isProduct && dealPrice ? Number(dealPrice) : undefined,
        isFlashDeal: isProduct ? isFlashDeal : false,
        totalFlashUnits: isProduct && isFlashDeal && totalFlashUnits ? Number(totalFlashUnits) : undefined,
        bonusCoins: Number(bonusCoins),
        badgeText: badgeText.trim() || "PINAK EXCLUSIVE",
        ctaText: ctaText.trim() || (isProduct ? "Add to Cart" : offerScope === "PRE_BOOK" ? "Reserve Table" : "Book & Pay"),
        isTableBookingEnabled: offerScope === "PRE_BOOK",
        bookingType: offerScope === "PRE_BOOK" ? "TABLE_RESERVATION" : undefined,
        slotTimes: offerScope === "PRE_BOOK" ? slotTimes : undefined,
        minPartySize: offerScope === "PRE_BOOK" ? Number(minPartySize) : undefined,
        maxPartySize: offerScope === "PRE_BOOK" ? Number(maxPartySize) : undefined,
        availableTablesPerSlot: offerScope === "PRE_BOOK" ? Number(availableTablesPerSlot) : undefined,
        seatingAreas: offerScope === "PRE_BOOK" ? seatingAreas : undefined,
        coverChargeAmount: offerScope === "PRE_BOOK" ? Number(coverChargeAmount) : undefined,
        gracePeriodMinutes: offerScope === "PRE_BOOK" ? Number(gracePeriodMinutes) : undefined,
        instantConfirmation: true,
      });

      onClose();
    } catch {
      // Error handled by parent toast
    }
  };

  const STEPS_NAV = [
    { id: 1, title: "1. Brand & Format", subtitle: "Outlet & Offer Type" },
    { id: 2, title: "2. Deal & Schedule", subtitle: "Discount & Validity" },
    { id: 3, title: "3. Terms & Publish", subtitle: "Fine Print & Live Preview" }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-2xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center font-bold">
                <TicketPercent size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEdit ? "Edit Offer Campaign" : "Create Store Offer"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Step {currentStep} of 3 • {STEPS_NAV[currentStep - 1]?.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-2">
              {STEPS_NAV.map(({ id: stepId, title: sTitle, subtitle }) => {
                const isActive = currentStep === stepId;
                const isPassed = currentStep > stepId;
                return (
                  <button
                    key={stepId}
                    type="button"
                    onClick={() => {
                      if (isPassed || stepId === 1) setCurrentStep(stepId as 1 | 2 | 3);
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
                      {isPassed ? <Check size={11} /> : stepId}
                    </div>
                    <div className="min-w-0 hidden sm:block">
                      <span
                        className={cn(
                          "text-[11px] font-bold truncate block",
                          isActive
                            ? "text-pink-600 dark:text-pink-400"
                            : isPassed
                            ? "text-slate-700 dark:text-slate-200"
                            : "text-slate-400"
                        )}
                      >
                        {sTitle}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate">{subtitle}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* ========================================================================= */}
            {/* STEP 1: OFFER ESSENTIALS & STORE IDENTITY */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Brand & Outlet Selection */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Building2 size={14} className="text-pink-600" />
                      <span>Select Merchant Brand & Outlet *</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {availableStoresForMerchant.length} branch(es) found
                    </span>
                  </div>

                  {merchants.length > 0 && (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Parent Brand
                      </label>
                      <select
                        value={selectedMerchantId}
                        onChange={(e) => setSelectedMerchantId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {merchants.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.businessName} ({m.city || "Nagpur"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Branch Outlet Selector Chips */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                      Applicable Store Branch
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedStoreId("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition",
                          selectedStoreId === "all"
                            ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        <Building2 size={12} />
                        <span>All Brand Outlets</span>
                      </button>

                      {availableStoresForMerchant.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedStoreId(s.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition",
                            selectedStoreId === s.id
                              ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                          )}
                        >
                          <StoreIcon size={12} />
                          <span>{s.branchName || s.storeName}</span>
                          <span className="text-[10px] opacity-75 font-normal">({s.city || "Nagpur"})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Offer Category / Format Selection */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Offer Type & Experience Format *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Pre-Booking Offer */}
                    <button
                      type="button"
                      onClick={() => setOfferScope("PRE_BOOK")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        offerScope === "PRE_BOOK"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-2 font-bold">
                        <Armchair size={16} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Pre-Booking Offer
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Table booking & confirmed slot bill discount
                      </div>
                      {offerScope === "PRE_BOOK" && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* Walk-in Offer */}
                    <button
                      type="button"
                      onClick={() => setOfferScope("WALK_IN")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        offerScope === "WALK_IN"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-2 font-bold">
                        <Utensils size={16} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Walk-in Offer
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Instant dine-in bill scan savings at outlet
                      </div>
                      {offerScope === "WALK_IN" && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* Store Retail Product */}
                    <button
                      type="button"
                      onClick={() => setOfferScope("STORE_PRODUCT")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        offerScope === "STORE_PRODUCT"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-2 font-bold">
                        <ShoppingBag size={16} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Product Deal
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Express billing counter item deal
                      </div>
                      {offerScope === "STORE_PRODUCT" && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Offer Title & Tagline with Auto-Generate */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                        Campaign Title *
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateTitle}
                        className="flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer"
                      >
                        <Wand2 size={12} />
                        <span>Auto-Generate</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={
                        offerScope === "PRE_BOOK"
                          ? "e.g. Flat 50% off on Pre-Booking & Bill"
                          : "e.g. Flat 50% off on Total Bill"
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-bold mt-1 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Subtitle / Tagline (Appears on Mobile Card)
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Available on Mon-Sun • Valid on minimum bill ₹1,000"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white mt-1 shadow-xs"
                    />
                  </div>
                </div>

                {/* Badge Text & Call to Action */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Deal Badge Text
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="e.g. PINAK EXCLUSIVE"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-pink-600 dark:text-pink-400 font-extrabold uppercase mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                      Mobile CTA Button
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Reserve Table / Book & Pay"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white mt-1"
                    />
                  </div>
                </div>

                {/* Visual Banner / Photo Selector */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Banner Cover Photo
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(CURATED_IMAGES[offerScope === "STORE_PRODUCT" ? "STORE_PRODUCT" : "STORE_DINING"] || []).map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={cn(
                          "relative rounded-xl overflow-hidden aspect-video border-2 transition cursor-pointer group",
                          imageUrl === img.url
                            ? "border-pink-600 ring-2 ring-pink-500/30"
                            : "border-transparent opacity-75 hover:opacity-100"
                        )}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] font-bold p-1 truncate text-center">
                          {img.label}
                        </span>
                        {imageUrl === img.url && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or enter custom image URL"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DEAL RULES, PRICING & VALIDITY */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* 1-Click Fast Discount Presets */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Zap size={14} className="text-amber-500" />
                    <span>Quick Discount Presets (Click to Auto-Fill)</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {PRESET_DISCOUNTS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setType(p.type);
                          setValue(p.val);
                          setMinBillAmount(p.minBill);
                          setMaxDiscount(p.maxDisc);
                          toast.success(`Applied ${p.label} preset!`);
                        }}
                        className={cn(
                          "py-2 px-1 rounded-xl border text-center font-bold text-xs transition cursor-pointer",
                          type === p.type && value === p.val
                            ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Offer Type Selector (4 Visual Cards) */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Choose Offer Benefit Structure *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* 1. Percentage Discount */}
                    <button
                      type="button"
                      onClick={() => {
                        setType("FLAT_PCT");
                        if (value > 100) setValue(20);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        type === "FLAT_PCT"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/40 text-pink-600 flex items-center justify-center mb-1.5 font-bold">
                        <Tag size={15} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Percentage OFF
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        % discount on bill with max cap
                      </div>
                      {type === "FLAT_PCT" && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* 2. Flat Amount Discount */}
                    <button
                      type="button"
                      onClick={() => setType("FLAT_AMT")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        type === "FLAT_AMT"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-1.5 font-bold">
                        <Coins size={15} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Flat Rupee (₹)
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Instant flat cash deduction
                      </div>
                      {type === "FLAT_AMT" && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* 3. Buy X Get Y Free */}
                    <button
                      type="button"
                      onClick={() => setType("BOGO")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        type === "BOGO"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-1.5 font-bold">
                        <Sparkles size={15} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Buy X Get Y Free
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        1+1, 2+1, 1+3 or custom
                      </div>
                      {type === "BOGO" && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* 4. Wallet Cashback */}
                    <button
                      type="button"
                      onClick={() => setType("CASHBACK")}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer relative",
                        type === "CASHBACK"
                          ? "bg-pink-50/70 dark:bg-pink-950/40 border-pink-500 shadow-sm ring-1 ring-pink-500"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-1.5 font-bold">
                        <Zap size={15} />
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Wallet Cashback
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Reward coins / wallet credit
                      </div>
                      {type === "CASHBACK" && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Core Dynamic Value Inputs */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  {/* Dedicated Buy X Get Y Rule Builder */}
                  {type === "BOGO" && (
                    <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-amber-500" />
                          <span>Buy X Get Y Free Combination</span>
                        </label>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                          Buy {buyQuantity} Get {getQuantity} Free
                        </span>
                      </div>

                      {/* Quick Ratio Presets */}
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { b: 1, g: 1, label: "Buy 1 Get 1 (1+1)" },
                          { b: 2, g: 1, label: "Buy 2 Get 1 (2+1)" },
                          { b: 3, g: 1, label: "Buy 3 Get 1 (3+1)" },
                          { b: 2, g: 2, label: "Buy 2 Get 2 (2+2)" },
                          { b: 1, g: 3, label: "Buy 1 Get 3 (1+3)" },
                        ].map((combo) => (
                          <button
                            key={combo.label}
                            type="button"
                            onClick={() => {
                              setBuyQuantity(combo.b);
                              setGetQuantity(combo.g);
                              toast.success(`Set to ${combo.label}!`);
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer",
                              buyQuantity === combo.b && getQuantity === combo.g
                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                : "bg-white dark:bg-slate-800 border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-100/50"
                            )}
                          >
                            {combo.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Numeric Spinners */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Customer Buys (Quantity) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={buyQuantity}
                            onChange={(e) => setBuyQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                            Customer Gets FREE (Quantity) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={getQuantity}
                            onChange={(e) => setGetQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] mb-1">
                        {type === "FLAT_PCT"
                          ? "Discount Percentage (%) *"
                          : type === "FLAT_AMT"
                          ? "Flat Discount Amount (₹) *"
                          : type === "BOGO"
                          ? "Equivalent Item Cover Value (₹) *"
                          : "Cashback Percentage (%) *"}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setValue(Number(e.target.value))}
                          min={1}
                          max={type === "FLAT_PCT" || type === "CASHBACK" ? 100 : 100000}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-2 font-bold text-slate-400">
                          {type === "FLAT_PCT" || type === "CASHBACK" ? "%" : "₹"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] mb-1">
                        Minimum Bill Spend (₹) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={minBillAmount}
                          onChange={(e) => setMinBillAmount(Number(e.target.value))}
                          min={0}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white"
                        />
                        <span className="absolute right-3 top-2 font-bold text-slate-400">₹</span>
                      </div>
                    </div>
                  </div>

                  {(type === "FLAT_PCT" || type === "CASHBACK" || type === "BOGO") && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          {type === "CASHBACK" ? "Maximum Cashback Cap (₹) *" : "Maximum Benefit Cap (₹) *"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Protects merchant margins from excessively high claims
                        </span>
                      </div>
                      <div className="relative w-36">
                        <input
                          type="number"
                          value={maxDiscount ?? 500}
                          onChange={(e) => setMaxDiscount(Number(e.target.value))}
                          min={10}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-slate-900 dark:text-white text-right pr-6"
                        />
                        <span className="absolute right-2.5 top-1.5 font-bold text-slate-400 text-xs">₹</span>
                      </div>
                    </div>
                  )}

                  {/* Live Calculation Feedback */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Calculator size={13} />
                      <span>
                        {type === "FLAT_PCT" && (
                          <>
                            Example: On a ₹1,000 bill, customer pays{" "}
                            <strong className="underline">
                              ₹{Math.max(1000 - Math.min((1000 * value) / 100, maxDiscount || 1000), 0)}
                            </strong>{" "}
                            (Saves ₹{Math.min((1000 * value) / 100, maxDiscount || 1000)})
                          </>
                        )}
                        {type === "FLAT_AMT" && (
                          <>
                            Example: Instant flat{" "}
                            <strong className="underline">₹{value} OFF</strong> on all bills of ₹{minBillAmount || 500} or more
                          </>
                        )}
                        {type === "BOGO" && (
                          <>
                            Example: Buy {buyQuantity} Get {getQuantity} Free — Customer orders {buyQuantity} item(s) and receives {getQuantity} complimentary (up to max cap of{" "}
                            <strong className="underline">₹{maxDiscount || 500}</strong>)
                          </>
                        )}
                        {type === "CASHBACK" && (
                          <>
                            Example: Customer earns{" "}
                            <strong className="underline">
                              ₹{Math.min((1000 * value) / 100, maxDiscount || 500)} Cashback
                            </strong>{" "}
                            credited to wallet on a ₹1,000 bill
                          </>
                        )}
                      </span>
                    </span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      Auto-Applied
                    </span>
                  </div>
                </div>

                {/* Pre-Booking Specific Table Slot Settings */}
                {offerScope === "PRE_BOOK" && (
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>Pre-Booking Time Slots & Capacity</span>
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                        {slotTimes.length} slots active
                      </span>
                    </div>

                    {/* Slot Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARD_SLOTS.map((s) => {
                        const isSelected = slotTimes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSlotTimes((prev) =>
                                prev.includes(s)
                                  ? (prev.length > 1 ? prev.filter((x) => x !== s) : prev)
                                  : [...prev, s]
                              );
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer",
                              isSelected
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white dark:bg-slate-800 border-purple-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-100"
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>

                    {/* Party Size & Grace Period */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-purple-100 dark:border-purple-900">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Party Size
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={minPartySize}
                            onChange={(e) => setMinPartySize(Number(e.target.value))}
                            min={1}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                          />
                          <span className="text-slate-400">to</span>
                          <input
                            type="number"
                            value={maxPartySize}
                            onChange={(e) => setMaxPartySize(Number(e.target.value))}
                            min={minPartySize}
                            className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Grace Period
                        </label>
                        <select
                          value={gracePeriodMinutes}
                          onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        >
                          <option value={10}>10 Minutes</option>
                          <option value={15}>15 Minutes</option>
                          <option value={20}>20 Minutes</option>
                          <option value={30}>30 Minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Cover Charge (₹)
                        </label>
                        <input
                          type="number"
                          value={coverChargeAmount}
                          onChange={(e) => setCoverChargeAmount(Number(e.target.value))}
                          min={0}
                          placeholder="0 (Free)"
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Retail Product Deals Specific Settings */}
                {offerScope === "STORE_PRODUCT" && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs block">
                      Retail Product Details & Pricing
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g. Amul Fresh Milk 1L"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Unit / Pack Size
                        </label>
                        <input
                          type="text"
                          value={unitOrWeight}
                          onChange={(e) => setUnitOrWeight(e.target.value)}
                          placeholder="e.g. 500g, 1L, Pack of 2"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Original MRP (₹)
                        </label>
                        <input
                          type="number"
                          value={originalPrice || ""}
                          onChange={(e) => setOriginalPrice(Number(e.target.value))}
                          placeholder="100"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Deal Price (₹) *
                        </label>
                        <input
                          type="number"
                          value={dealPrice || ""}
                          onChange={(e) => setDealPrice(Number(e.target.value))}
                          placeholder="70"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-extrabold text-pink-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          value={totalFlashUnits || 50}
                          onChange={(e) => setTotalFlashUnits(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campaign Schedule & Validity */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <Calendar size={14} className="text-pink-600" />
                      <span>Campaign Schedule & Duration *</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[7, 14, 30, 90].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => handleSetDurationDays(days)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-pink-100 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-pink-600 transition cursor-pointer"
                        >
                          +{days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Valid From Date *
                      </label>
                      <input
                        type="date"
                        value={validFrom}
                        onChange={(e) => setValidFrom(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Valid To Date *
                      </label>
                      <input
                        type="date"
                        value={validTo}
                        onChange={(e) => setValidTo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Active Days */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Active Days of Week</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveDays(ALL_DAYS)}
                          className="text-[10px] font-bold text-pink-600 hover:underline cursor-pointer"
                        >
                          All Days
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setActiveDays(["Mon", "Tue", "Wed", "Thu", "Fri"])}
                          className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Weekdays
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setActiveDays(["Sat", "Sun"])}
                          className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                        >
                          Weekends
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {ALL_DAYS.map((day) => {
                        const active = activeDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleDay(day)}
                            className={cn(
                              "py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer text-center",
                              active
                                ? "bg-pink-600 text-white border-pink-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: TERMS & FINE PRINT + PREVIEW & PUBLISH */}
            {/* ========================================================================= */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* HERO SECTION: TERMS & FINE PRINT */}
                <div className="p-4 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-purple-200/80 dark:border-purple-900/50 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                        <ListChecks size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          Terms & Fine Print *
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {termsList.length} condition(s) attached • Add only the terms you need
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateTerms}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-[10px] font-bold cursor-pointer transition"
                      >
                        <Wand2 size={11} />
                        <span>Auto-Generate T&C</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRawTerms(!showRawTerms)}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                      >
                        <FileText size={11} />
                        <span>{showRawTerms ? "Bullet Mode" : "Raw Text"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Fast Add Preset Term Chips */}
                  {!showRawTerms && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Quick-Add Standard Store Conditions (Click to Add / Remove):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_TERMS.map((pt, i) => {
                          const isAdded = termsList.some((t) => t.toLowerCase() === pt.toLowerCase());
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleTogglePresetTerm(pt)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer flex items-center gap-1.5",
                                isAdded
                                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                              )}
                            >
                              {isAdded ? <Check size={10} /> : <Plus size={10} />}
                              <span>{pt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Terms List Manager */}
                  {!showRawTerms ? (
                    <div className="space-y-2">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {termsList.map((term, index) => (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group shadow-2xs"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                •
                              </span>
                              <span className="text-[11px] text-slate-800 dark:text-slate-200 leading-snug">
                                {term}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTerm(index)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer shrink-0 opacity-60 group-hover:opacity-100"
                              title="Remove condition"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}

                        {termsList.length === 0 && (
                          <div className="p-3 text-center text-slate-400 text-xs italic bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            No terms added yet. Click preset chips above or type a custom term below.
                          </div>
                        )}
                      </div>

                      {/* Add Custom Term Input */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={customTermInput}
                          onChange={(e) => setCustomTermInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTerm();
                            }
                          }}
                          placeholder="Type a custom condition & press Enter (e.g. Valid on birthday celebrations)"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTerm}
                          disabled={!customTermInput.trim()}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shrink-0"
                        >
                          <Plus size={12} />
                          <span>Add Term</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Raw Textarea Mode */
                    <div className="space-y-1.5">
                      <textarea
                        rows={5}
                        value={rawTermsText}
                        onChange={(e) => {
                          setRawTermsText(e.target.value);
                          setTermsList(
                            e.target.value
                              .split(/\n|•/)
                              .map((t) => t.trim())
                              .filter((t) => t.length > 2)
                          );
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                        placeholder="• Type each term on a new line..."
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Tip: Start each line with • for automatic bullet point display on mobile.
                      </span>
                    </div>
                  )}
                </div>

                {/* Offer Summary Overview */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {merchantDisplayName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedStore ? selectedStore.branchName : "All Brand Outlets"} • {validFrom} to {validTo}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-pink-600 text-sm block">
                      {type === "FLAT_PCT" ? `${value}% OFF` : `₹${value} OFF`}
                    </span>
                    <span className="text-[10px] text-slate-400">Min spend: ₹{minBillAmount}</span>
                  </div>
                </div>

                {/* LIVE CONSUMER MOBILE SCREEN PREVIEW (Matching code.html) */}
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Eye size={14} className="text-pink-600" />
                      <span>Live Consumer Mobile Card Preview</span>
                    </span>
                    <span className="text-[10px] text-pink-600 font-bold bg-pink-50 dark:bg-pink-950 px-2 py-0.5 rounded-md">
                      {offerScope === "PRE_BOOK" ? "Pre-booking offer" : "Walk-in offer"}
                    </span>
                  </div>

                  {/* Exact Mobile Card as Rendered on PINAK App */}
                  <div className="max-w-sm mx-auto bg-white dark:bg-[#121626] rounded-2xl overflow-hidden border border-purple-200 dark:border-purple-900/60 shadow-lg">
                    {/* Visual Card Image */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {badgeText && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-700 text-white shadow-xs">
                          {badgeText}
                        </span>
                      )}
                      <span className="absolute bottom-2.5 left-2.5 text-white font-extrabold text-sm drop-shadow-md">
                        {merchantDisplayName}
                      </span>
                    </div>

                    {/* Deal Body with Voucher Border */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded uppercase border border-purple-200">
                            PINAK Deal
                          </span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded uppercase border border-amber-200">
                            Special Deal
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Zap size={10} /> Instant
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {title || `Flat ${value}% off on Total Bill`}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {tagline || `Available on Mon-Sun • Valid on minimum bill ₹${minBillAmount}`}
                      </p>

                      <div className="h-[1px] w-full border-b border-dashed border-slate-200 dark:border-slate-800 my-2" />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                          Auto-applied at checkout
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPreviewTermsOpen(!isPreviewTermsOpen)}
                          className="text-purple-600 dark:text-purple-400 font-bold text-[11px] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{isPreviewTermsOpen ? "Hide T&C" : "View T&C"}</span>
                          <ChevronRight size={11} className={cn("transition-transform", isPreviewTermsOpen && "rotate-90")} />
                        </button>
                      </div>

                      {/* Interactive View T&C Bottom Sheet / Popup Preview */}
                      {isPreviewTermsOpen && (
                        <div className="mt-2.5 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 dark:text-purple-200 text-[11px] flex items-center gap-1">
                              <ShieldCheck size={12} />
                              <span>Terms & Conditions ({termsList.length})</span>
                            </span>
                          </div>
                          <ul className="space-y-1 text-[10px] text-slate-700 dark:text-slate-300">
                            {termsList.map((t, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                                <span className="text-purple-600 font-bold shrink-0">•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Stepper Footer Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-3">
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
                Step {currentStep} of 3
              </span>
              {currentStep < 3 ? (
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
                  onClick={() => handleSubmit()}
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
