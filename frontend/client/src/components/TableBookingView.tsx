import React, { useState, useMemo } from "react";
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
  Info,
  Share2,
  MessageSquare,
  Phone,
  MapPin,
  CalendarClock,
  Smartphone,
  ArrowRight,
  X,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface BookingOptionItem {
  id: string;
  title: string;
  discountPct?: number;
  coverChargePerGuest: number;
  isExclusive?: boolean;
  isRegular?: boolean;
  perkHighlight?: string;
}

export interface TableBookingViewProps {
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  storeCuisines?: string;
  initialGuests?: number;
  initialSlot?: string;
  initialOfferTitle?: string;
  initialOfferDiscount?: number;
  initialCoverCharge?: number;
  onBack: () => void;
  onBookingConfirmed?: (bookingDetails: any) => void;
}

export const TableBookingView: React.FC<TableBookingViewProps> = ({
  storeId,
  storeName = "Haldiram's Sweets & Snacks – Nagpur Flagship",
  storeAddress = "West High Court Road, Dharampeth",
  storeCuisines = "North Indian, Sweets & Snacks",
  initialGuests = 2,
  initialSlot = "01:45 PM",
  initialOfferTitle,
  initialOfferDiscount,
  initialCoverCharge = 25,
  onBack,
  onBookingConfirmed
}) => {
  // 1. Guests Selection
  const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const [selectedGuests, setSelectedGuests] = useState<number>(initialGuests);

  // 2. Date Carousel (Upcoming 7 days dynamically computed)
  const upcomingDates = useMemo(() => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dayName =
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short" });
      const discount =
        i === 0
          ? "20% off"
          : i === 1
          ? "15% off"
          : i === 2
          ? "15% off"
          : i === 3
          ? "10% off"
          : "20% off";
      dates.push({
        key: d.toISOString().split("T")[0],
        month,
        dayNum,
        dayName,
        discount,
        fullDate: d
      });
    }
    return dates;
  }, []);

  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const selectedDate = upcomingDates[selectedDateIndex] || upcomingDates[0];

  // 3. Meal Time Toggle (Lunch / Dinner)
  const [mealType, setMealType] = useState<"LUNCH" | "DINNER">("LUNCH");

  // 4. Slots Grid
  const lunchSlots = useMemo(
    () => [
      { time: "12:45 PM", discount: "15% off" },
      { time: "01:00 PM", discount: "20% off" },
      { time: "01:15 PM", discount: "20% off" },
      { time: "01:30 PM", discount: "20% off" },
      { time: "01:45 PM", discount: "20% off" },
      { time: "02:00 PM", discount: "20% off" },
      { time: "02:15 PM", discount: "20% off" },
      { time: "02:30 PM", discount: "20% off" },
      { time: "02:45 PM", discount: "20% off" },
      { time: "03:00 PM", discount: "20% off" },
      { time: "03:15 PM", discount: "20% off" },
      { time: "03:30 PM", discount: "20% off" }
    ],
    []
  );

  const dinnerSlots = useMemo(
    () => [
      { time: "07:00 PM", discount: "20% off" },
      { time: "07:15 PM", discount: "20% off" },
      { time: "07:30 PM", discount: "20% off" },
      { time: "07:45 PM", discount: "20% off" },
      { time: "08:00 PM", discount: "20% off" },
      { time: "08:15 PM", discount: "15% off" },
      { time: "08:30 PM", discount: "15% off" },
      { time: "08:45 PM", discount: "15% off" },
      { time: "09:00 PM", discount: "20% off" },
      { time: "09:15 PM", discount: "20% off" },
      { time: "09:30 PM", discount: "20% off" },
      { time: "10:00 PM", discount: "15% off" }
    ],
    []
  );

  const currentSlots = mealType === "LUNCH" ? lunchSlots : dinnerSlots;
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot || "01:45 PM");
  const [showAllSlots, setShowAllSlots] = useState<boolean>(false);

  // 5. Booking Options
  const primaryTitle = initialOfferTitle || "Flat 20% off on Total Bill";
  const exclusiveOptions: BookingOptionItem[] = [
    {
      id: "opt_primary",
      title: primaryTitle,
      discountPct: initialOfferDiscount || 20,
      coverChargePerGuest: initialCoverCharge || 25,
      isExclusive: true,
      perkHighlight: "Redeem it by paying final bill via PINAK"
    },
    {
      id: "opt_15",
      title: "Flat 15% off on Total Bill",
      discountPct: 15,
      coverChargePerGuest: 10,
      isExclusive: true,
      perkHighlight: "Redeem it by paying final bill via PINAK"
    },
    {
      id: "opt_10",
      title: "Flat 10% off on Total Bill",
      discountPct: 10,
      coverChargePerGuest: 25,
      isExclusive: true,
      perkHighlight: "Redeem it by paying final bill via PINAK"
    }
  ];

  const regularOption: BookingOptionItem = {
    id: "opt_regular",
    title: "Standard table booking",
    coverChargePerGuest: 0,
    isRegular: true
  };

  const [selectedOptionId, setSelectedOptionId] = useState<string>("opt_primary");
  const activeOption =
    exclusiveOptions.find((o) => o.id === selectedOptionId) ||
    (selectedOptionId === "opt_regular" ? regularOption : exclusiveOptions[0]);

  const totalCoverCharge = selectedGuests * activeOption.coverChargePerGuest;

  // 6. Accordions
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(true);
  const [isCheckoutTermsOpen, setIsCheckoutTermsOpen] = useState<boolean>(false);
  const [isConfirmedTermsOpen, setIsConfirmedTermsOpen] = useState<boolean>(false);

  // 7. Navigation Flow: "select_slot" -> "checkout_bill" -> "confirmed"
  type BookingStep = "select_slot" | "checkout_bill" | "confirmed";
  const [bookingStep, setBookingStep] = useState<BookingStep>("select_slot");
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
  const [includeVipPlan, setIncludeVipPlan] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Google Pay");

  const vipPlanFee = includeVipPlan ? 1 : 0;
  const totalToPay = totalCoverCharge + vipPlanFee;

  const handleProceedToCheckout = () => {
    setBookingStep("checkout_bill");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmPaymentAndBooking = () => {
    const bookingRef = `PNK-TB-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedBookingId(bookingRef);
    setIsCancelled(false);
    setBookingStep("confirmed");
    window.scrollTo({ top: 0, behavior: "smooth" });

    const details = {
      bookingRef,
      storeName,
      storeAddress,
      guests: selectedGuests,
      date: `${selectedDate.month} ${selectedDate.dayNum} (${selectedDate.dayName})`,
      time: selectedSlot,
      offerTitle: activeOption.title,
      coverCharge: totalCoverCharge,
      amountPaid: totalToPay,
      paymentMethod: selectedPaymentMethod
    };

    if (onBookingConfirmed) {
      onBookingConfirmed(details);
    }
    toast.success(`Table confirmed at ${storeName}!`, {
      description: `Reservation #${bookingRef} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}`
    });
  };

  // If confirmed or cancelled, render confirmation/cancellation screen (Matching User's Reference Screenshots)
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
                      navigator.share({
                        title: `Table booked at ${storeName}`,
                        text: `Reservation confirmed at ${storeName} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}.`
                      }).catch(() => {});
                    } else {
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
                      : "Need help with your table booking? Contact +91 800-PINAK-HELP"
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
            {/* Hero Section: Green Check if Booked, Coral Red X if Cancelled */}
            {isCancelled ? (
              <div className="text-center pt-3 pb-1">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-full bg-rose-400/25 blur-2xl scale-175 animate-pulse" />
                  <div className="w-14 h-14 rounded-full bg-[#f24e53] text-white flex items-center justify-center relative shadow-lg shadow-rose-500/30">
                    <X size={28} className="stroke-[3.5]" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-[#f24e53] dark:text-rose-400 tracking-tight">
                  Booking cancelled
                </h1>
              </div>
            ) : (
              <div className="text-center pt-3 pb-1">
                <div className="relative inline-flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-150 animate-pulse" />
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center relative shadow-lg shadow-emerald-500/30">
                    <Check size={28} className="stroke-[3.5]" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-[#0d5c3a] dark:text-emerald-400 tracking-tight">
                  Your table is booked!
                </h1>
              </div>
            )}

            {/* Reservation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 space-y-3">
                {/* Status badge */}
                <span
                  className={cn(
                    "text-xs font-black block tracking-tight",
                    isCancelled
                      ? "text-[#f24e53] dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isCancelled ? "Cancelled" : "Confirmed"}
                </span>

                {/* 3 Column Grid: Date, Meal & Slot, Guests */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {selectedDate.dayName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {selectedDate.dayNum} {selectedDate.month} {selectedDate.fullDate.getFullYear()}
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {mealType === "DINNER" ? "Dinner" : "Lunch"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {selectedSlot}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      for {selectedGuests}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      guests
                    </p>
                  </div>
                </div>

                {/* Restaurant details with Call & Directions buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                      {storeName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {storeAddress || "Bajaj Nagar, Nagpur"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = "tel:+918007462500";
                      }}
                      className="w-10 h-10 rounded-xl bg-[#f2f8f5] hover:bg-[#e4f3ec] dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition cursor-pointer border border-emerald-100 dark:border-emerald-900/60 shadow-2xs"
                      title="Call Restaurant"
                    >
                      <Phone size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(storeName + " " + (storeAddress || "Nagpur"))}`,
                          "_blank"
                        );
                      }}
                      className="w-10 h-10 rounded-xl bg-[#f2f8f5] hover:bg-[#e4f3ec] dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition cursor-pointer border border-emerald-100 dark:border-emerald-900/60 shadow-2xs"
                      title="Directions"
                    >
                      <MapPin size={17} />
                    </button>
                  </div>
                </div>

                {/* Pay bill now button (Only if NOT cancelled) */}
                {!isCancelled && (
                  <>
                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-1" />
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs tracking-wide uppercase cursor-not-allowed text-center"
                    >
                      Pay bill now
                    </button>
                  </>
                )}
              </div>

              {/* Attached bottom perks strip */}
              <div className="bg-[#f4efe6] dark:bg-amber-950/40 border-t border-amber-200/60 dark:border-amber-900/40 px-4 py-2.5 flex items-center gap-2 text-xs">
                <span className="bg-[#e7d8bb] dark:bg-amber-900/50 text-[#7c5513] dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  🪙 2X
                </span>
                <span className="font-bold text-[#0f6647] dark:text-emerald-300 text-[11px] truncate">
                  Earn 20% PINAK Coins on bill payment
                </span>
              </div>
            </div>

            {/* Promo Feature Banner ("Split Pay") */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1.5 justify-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <Sparkles size={11} className="fill-purple-600 text-purple-600" />
                <span>NEW ON PINAK</span>
              </div>
              <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">
                    INTRODUCING
                  </span>
                  <h4 className="text-base font-black text-white leading-tight">
                    Split Pay
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-1 font-medium leading-tight">
                    <span>Split bill with friends minus the awkwardness</span>
                    <ChevronRight size={12} className="shrink-0" />
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-purple-800/40 border border-purple-700/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  👥
                </div>
              </div>
            </div>

            {/* "What to do next?" Card (Only if NOT cancelled) */}
            {!isCancelled && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 space-y-3.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    What to do next?
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <CalendarClock size={16} />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      Reach restaurant on the booked date and time
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <Smartphone size={16} />
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      Pay your dining bill via PINAK, your offer gets auto applied!
                    </p>
                  </div>
                </div>

                {/* Soft alert banner inside card */}
                <div className="bg-[#fff9e6] dark:bg-amber-950/40 border-t border-amber-200/60 dark:border-amber-900/40 px-4 py-2.5 text-center text-xs font-bold text-amber-800 dark:text-amber-300">
                  You may have to wait for your table to get ready
                </div>
              </div>
            )}

            {/* "View restaurant details" Card */}
            <div
              onClick={onBack}
              className={cn(
                "rounded-2xl p-4 flex items-center justify-between cursor-pointer transition shadow-2xs",
                isCancelled
                  ? "bg-[#fff4ef] hover:bg-[#ffece4] dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50"
                  : "bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60"
              )}
            >
              <span
                className={cn(
                  "text-sm font-black",
                  isCancelled
                    ? "text-[#e85b46] dark:text-rose-400"
                    : "text-purple-700 dark:text-purple-300"
                )}
              >
                View restaurant details
              </span>
              <ArrowRight
                size={18}
                className={
                  isCancelled
                    ? "text-[#e85b46] dark:text-rose-400"
                    : "text-purple-700 dark:text-purple-300"
                }
              />
            </div>

            {/* Cancellation Row (Only if NOT cancelled) */}
            {!isCancelled && (
              <div className="flex items-center justify-between px-2 pt-1 pb-1 text-xs">
                <span className="text-slate-500 font-medium">Can't make it to the restaurant?</span>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Cancel booking
                </button>
              </div>
            )}

            {/* "Offer terms & conditions" Accordion (Only if NOT cancelled) */}
            {!isCancelled && (
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
                    <p>• The deal must be redeemed/bill paid within 6 hours of the dining start time, or the offer will expire.</p>
                    <p>• Discount, if any, can only be availed when you pay your bill via PINAK.</p>
                    <p>• The paid cover charge will be redeemed automatically when you pay your bill via PINAK.</p>
                    <p>• Cover charges will be fully refunded only if booking is cancelled before the dining start time.</p>
                    <p>• A maximum of Rs. 3,00,000 can be paid in a single bill payment transaction via PINAK.</p>
                    <p>• The booking details via WhatsApp, email, or on the app need to be shown at the restaurant before ordering.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-[#f24e53] flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Cancel Table Reservation?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to cancel your table at <span className="font-bold text-slate-800 dark:text-slate-200">{storeName}</span>?
                </p>
                {totalToPay > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    ₹{totalToPay} cover charge will be automatically refunded to your original payment method within 2 hours.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setIsCancelled(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    toast.error("Table reservation cancelled", {
                      description: "Cover charge refund has been initiated."
                    });
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#f24e53] hover:bg-[#df3d42] text-white font-black text-xs shadow-md transition cursor-pointer"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Center Done Button matching screenshots */}
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={onBack}
            className="pointer-events-auto px-12 py-3 rounded-2xl bg-[#009b60] hover:bg-[#008552] text-white font-black text-sm shadow-xl active:scale-95 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Pre-book Bill Details & Payment Screen (Matching Pinak Brand Palette)
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
                {storeName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                {storeAddress ? storeAddress.split(",")[0] : "Nagpur"}
              </p>
            </div>
          </header>

          <div className="p-3.5 space-y-3.5">
            {/* Top Emerald Highlight Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 flex items-center justify-between text-emerald-800 dark:text-emerald-300 shadow-2xs">
              <span className="text-xs font-bold leading-snug">
                Your cover charge of ₹{totalCoverCharge} will be redeemed when you pay your bill via PINAK
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

                {/* Restaurant Name & Locality */}
                <div className="pt-0.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {storeName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {storeAddress || "Bajaj Nagar, Nagpur"}
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
                      {activeOption.title || "Flat 15% off on Total Bill"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Strip inside Card */}
              <div className="bg-purple-50/60 dark:bg-purple-950/30 border-t border-purple-100/80 dark:border-purple-900/40 px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  {totalCoverCharge > 0 && (
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Redeem ₹{totalCoverCharge} cover +
                    </span>
                  )}
                  <div className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-900 dark:text-amber-200 shadow-2xs">
                    <span>🪙 2X</span>
                  </div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate">
                    Earn 20% PINAK Coins on bill...
                  </span>
                </div>
              </div>
            </div>

            {/* Special Plan Added For You Card */}
            <div className="pt-1.5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-2 relative pt-3.5">
                <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded shadow-2xs uppercase tracking-wide">
                  Special plan added for you
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-700 dark:text-purple-300 text-sm tracking-tight font-sans">
                      pinak <span className="text-slate-900 dark:text-white font-bold">1 Month Plan</span>
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹1
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  Enjoy unlimited access to pre-book offers on 7500+ restaurants.
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("PINAK VIP gives unlimited 20% cashback + zero reservation fees.")}
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
                {/* Cover charges row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Cover charges for {selectedGuests}
                    </p>
                    {totalCoverCharge > 0 ? (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                        Redeem it by paying bill via PINAK
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        Zero cover charge
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {totalCoverCharge > 0 ? `₹${totalCoverCharge}` : "₹0"}
                  </span>
                </div>

                {/* VIP Plan Row */}
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
                  Offer terms & conditions
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
                  <p>• The deal must be redeemed/bill paid within 6 hours of the dining start time, or the offer will expire.</p>
                  <p>• Discount, if any, can only be availed when you pay your bill via PINAK.</p>
                  <p>• The paid cover charge will be redeemed automatically when you pay your bill via PINAK.</p>
                  <p>• Cover charges will be fully refunded only if booking is cancelled before the dining start time.</p>
                  <p>• A maximum of Rs. 3,00,000 can be paid in a single bill payment transaction via PINAK.</p>
                  <p>• The booking details via WhatsApp, email, or on the app need to be shown at the restaurant before ordering.</p>
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
                prev === "Google Pay" ? "PhonePe" : prev === "PhonePe" ? "PINAK UPI" : "Google Pay"
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
            onClick={handleConfirmPaymentAndBooking}
            className="flex-1 max-w-[190px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-purple-900/25 active:scale-98 transition cursor-pointer"
          >
            <span>Pay ₹{totalToPay}</span>
          </button>
        </footer>
      </div>
    );
  }

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
              {storeName}
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
            <span>Get flat 10% PINAK Coins on your bill payment</span>
          </div>
        </div>

        <div className="px-4 py-3 space-y-5">
          {/* ========================================================= */}
          {/* 3. NUMBER OF GUESTS */}
          {/* ========================================================= */}
          <section>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2.5">
              Number of guest(s)
            </h2>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {GUEST_OPTIONS.map((num) => {
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
                    {num === 8 ? "8+" : num}
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
                        isSelected ? "text-purple-700 dark:text-purple-300" : "text-slate-900 dark:text-white"
                      )}
                    >
                      {dateObj.dayNum}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      {dateObj.dayName}
                    </span>
                    <span className="bg-emerald-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-2xs">
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
                  setSelectedSlot("01:45 PM");
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mealType === "LUNCH"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-purple-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                )}
              >
                <Sun size={13} className="stroke-[2.5]" />
                <span>Lunch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMealType("DINNER");
                  setSelectedSlot("07:30 PM");
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  mealType === "DINNER"
                    ? "bg-slate-900 text-white shadow-xs dark:bg-purple-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                )}
              >
                <Moon size={13} className="stroke-[2.5]" />
                <span>Dinner</span>
              </button>
            </div>

            {/* Slots Grid */}
            <div className="grid grid-cols-4 gap-2">
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
                        isSelected ? "text-purple-700 dark:text-purple-300" : "text-slate-800 dark:text-white"
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
              Booking option for {selectedSlot}
            </h2>

            {/* Exclusive Card Container */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 font-black text-xs uppercase tracking-wider">
                <Sparkles size={13} className="fill-purple-600 text-purple-600" />
                <span>PINAK EXCLUSIVE</span>
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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Redeemable cover charge:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            ₹{opt.coverChargePerGuest}/guest
                          </strong>
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
                  1 month PINAK VIP plan for ₹1 will be auto-added in next step.
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-400 shrink-0 ml-1 hover:underline cursor-pointer">
                  View benefits
                </span>
              </div>
            </div>

            {/* Regular Offer Card */}
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
                    Standard table booking
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    Cover charge: <strong className="text-emerald-600">FREE</strong>
                  </p>
                </div>
              </div>
            </div>

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
                <p>• Standard terms and conditions apply.</p>
                <p>
                  • The deal must be redeemed / bill paid within 6 hours of the dining start time, or the
                  offer will expire.
                </p>
                <p>
                  • Discount, if any, can only be availed when you pay your bill via PINAK.
                </p>
                <p>
                  • The paid cover charge will be redeemed automatically when you pay your bill via PINAK.
                </p>
                <p>
                  • Cover charges will be fully refunded only if booking is cancelled before the dining
                  start time.
                </p>
                <p>
                  • A maximum of Rs. 3,00,000 can be paid in a single bill payment transaction via PINAK.
                </p>
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
