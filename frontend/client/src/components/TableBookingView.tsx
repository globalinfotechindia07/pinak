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
  Sparkles,
  CheckCircle2,
  Check,
  ShieldCheck,
  Store,
  TicketPercent,
  Info
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

  // 6. Accordion for Terms
  const [isTermsOpen, setIsTermsOpen] = useState<boolean>(true);

  // 7. Booking Confirmation State
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");

  const handleProceedToBook = () => {
    const bookingRef = `PNK-TB-${Math.floor(100000 + Math.random() * 900000)}`;
    setConfirmedBookingId(bookingRef);
    setIsConfirmed(true);

    const details = {
      bookingRef,
      storeName,
      storeAddress,
      guests: selectedGuests,
      date: `${selectedDate.month} ${selectedDate.dayNum} (${selectedDate.dayName})`,
      time: selectedSlot,
      offerTitle: activeOption.title,
      coverCharge: totalCoverCharge
    };

    if (onBookingConfirmed) {
      onBookingConfirmed(details);
    }
    toast.success(`Table confirmed at ${storeName}!`, {
      description: `Reservation #${bookingRef} for ${selectedGuests} guests on ${selectedDate.dayName} at ${selectedSlot}`
    });
  };

  // If confirmed, render instant confirmation screen
  if (isConfirmed) {
    return (
      <div className="min-h-full bg-[#fbfbff] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
        <div>
          {/* Top header */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Instant Confirmation
            </span>
            <div className="w-9" />
          </div>

          {/* Success Hero */}
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border-4 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 size={42} className="stroke-[2.5]" />
            </div>
            <span className="inline-block bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2 border border-purple-200 dark:border-purple-800">
              PINAK Table Reserved
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
              Table Reservation Confirmed!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Booking Ref: <strong className="text-slate-900 dark:text-white font-mono text-sm">{confirmedBookingId}</strong>
            </p>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4 space-y-3">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{storeName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{storeAddress}</p>
                <p className="text-[10px] text-purple-600 font-bold mt-1">🍽️ {storeCuisines}</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-md shrink-0">
                Confirmed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-medium">Guests</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedGuests} People
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-medium">Date</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {selectedDate.dayName}, {selectedDate.dayNum} {selectedDate.month}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] text-slate-400 font-medium">Time Slot</p>
                <p className="text-sm font-black text-purple-700 dark:text-purple-400 mt-0.5">
                  {selectedSlot}
                </p>
              </div>
            </div>

            <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Offer Applied
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white">{activeOption.title}</p>
              </div>
              <span className="bg-purple-700 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                {activeOption.discountPct ? `${activeOption.discountPct}% OFF` : "FREE TABLE"}
              </span>
            </div>

            {totalCoverCharge > 0 ? (
              <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600 dark:text-slate-300">
                <span>Redeemable Cover Charge:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ₹{totalCoverCharge} (₹{activeOption.coverChargePerGuest} × {selectedGuests})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1 px-1 text-emerald-600 font-bold">
                <span>Cover Charge:</span>
                <span>FREE</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center">
              💡 The cover charge will be automatically adjusted when you pay your bill via PINAK.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Return to Store</span>
          </button>
        </div>
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
      {/* 8. STICKY BOTTOM ACTION BAR */}
      {/* ========================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 max-w-[430px] mx-auto shadow-2xl">
        <div className="flex items-center gap-3">
          {totalCoverCharge > 0 && (
            <div className="shrink-0 text-left pl-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                Cover Charge
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₹{totalCoverCharge}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleProceedToBook}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-98 transition cursor-pointer"
          >
            <span>Proceed to book</span>
            {totalCoverCharge > 0 && (
              <span className="text-xs font-normal opacity-90">• ₹{totalCoverCharge}</span>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
export default TableBookingView;
