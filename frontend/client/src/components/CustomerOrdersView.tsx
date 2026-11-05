import React, { useState, useEffect } from "react";
import {
  CalendarClock,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Phone,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  TicketPercent,
  Receipt,
  UtensilsCrossed,
  ArrowRight,
  AlertTriangle,
  X,
  CreditCard,
  Share2
} from "lucide-react";
import tableBookingApi, { TableBookingDetails } from "@/api/tableBookingApi";
import PayBillView from "./PayBillView";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CustomerOrdersViewProps {
  onBackToDiscover: () => void;
  onSelectStore?: (storeId: string) => void;
  onPayBillForBooking?: (booking: TableBookingDetails) => void;
  onPayingBillChange?: (isPaying: boolean) => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({
  onBackToDiscover,
  onSelectStore,
  onPayBillForBooking,
  onPayingBillChange
}) => {
  const [activeTab, setActiveTab] = useState<"bookings" | "deals">("bookings");
  const [bookings, setBookings] = useState<TableBookingDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPassBooking, setSelectedPassBooking] = useState<TableBookingDetails | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<TableBookingDetails | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("Change of plans");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [payingBooking, setPayingBooking] = useState<TableBookingDetails | null>(null);

  useEffect(() => {
    onPayingBillChange?.(Boolean(payingBooking));
  }, [payingBooking, onPayingBillChange]);

  // Fetch live bookings
  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await tableBookingApi.listBookings();
      setBookings(data || []);
    } catch (err) {
      console.warn("Could not fetch customer bookings:", err);
      toast.error("Could not load your reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Handle cancellation
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await tableBookingApi.cancelBooking(cancellingBooking.bookingRef, {
        cancellationReason: cancellationReason || "Change of plans",
        comments: "Cancelled from Customer Orders tab"
      });
      toast.success("Reservation cancelled", {
        description: `100% refund of ₹${cancellingBooking.totalCoverCharge || 0} initiated.`
      });
      setCancellingBooking(null);
      await loadBookings();
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error("Could not cancel reservation. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  // If user selected to pay bill for a booking, render PayBillView
  if (payingBooking) {
    return (
      <PayBillView
        storeId={payingBooking.storeId}
        storeName={payingBooking.storeName}
        storeAddress={payingBooking.storeAddress}
        coverImageUrl={payingBooking.coverImageUrl}
        initialBillAmount={payingBooking.billAmount != null ? Number(payingBooking.billAmount) : undefined}
        bookingRef={payingBooking.bookingRef}
        bookingId={payingBooking.bookingId}
        offerTitle={payingBooking.offerTitle}
        offerDiscountPct={payingBooking.discountPct != null ? Number(payingBooking.discountPct) : undefined}
        coverChargeAmount={payingBooking.totalCoverCharge != null ? Number(payingBooking.totalCoverCharge) : undefined}
        customerPhone={payingBooking.customerPhone}
        customerName={payingBooking.customerName}
        onBack={() => setPayingBooking(null)}
        onPaymentSuccess={(details) => {
          loadBookings();
          setPayingBooking(null);
        }}
      />
    );
  }

  const activeBookings = bookings.filter((b) => b.status !== "CANCELLED");
  const pastBookings = bookings.filter((b) => b.status === "CANCELLED");

  return (
    <div className="min-h-screen bg-[#f8f9fd] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Manrope'] pb-28">
      {/* 1. Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDiscover}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
            title="Back to Discover"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              My Bookings &amp; Orders
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              Live reservations and dining passes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadBookings}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="Refresh reservations"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
        </button>
      </header>

      {/* 2. Top Segment Switcher Tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl flex items-center gap-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === "bookings"
                ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <UtensilsCrossed size={14} />
            <span>Table Reservations</span>
            {activeBookings.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] flex items-center justify-center font-bold">
                {activeBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deals")}
            className={cn(
              "flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === "deals"
                ? "bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <TicketPercent size={14} />
            <span>Meal Vouchers &amp; Deals</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className="px-4 py-2 space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Loading your bookings...
            </p>
          </div>
        ) : activeTab === "bookings" ? (
          bookings.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-3.5 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-100 dark:border-purple-900">
                <UtensilsCrossed size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  No Table Reservations Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Book a table at top restaurants and get up to 50% discount on your dining bill.
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToDiscover}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 active:scale-98 transition cursor-pointer"
              >
                <span>Explore Restaurants</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {bookings.map((booking) => {
                const isCancelled = booking.status === "CANCELLED";
                const isSeated = booking.status === "SEATED";
                const isCompleted = booking.status === "COMPLETED";
                const isConfirmed = booking.status === "CONFIRMED";

                return (
                  <div
                    key={booking.bookingId || booking.bookingRef}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition hover:shadow-md"
                  >
                    {/* Card Top: Store and Status */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Ref: {booking.bookingRef}
                            </span>
                          </div>
                          <h3
                            onClick={() => onSelectStore && onSelectStore(booking.storeId)}
                            className="text-base font-black text-slate-900 dark:text-white hover:text-purple-700 dark:hover:text-purple-300 transition cursor-pointer truncate mt-0.5"
                          >
                            {booking.storeName}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <MapPin size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{booking.storeAddress}</span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div className="shrink-0">
                          {isConfirmed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Confirmed
                            </span>
                          )}
                          {isSeated && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              Seated
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle2 size={11} />
                              Paid • Completed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase tracking-wider">
                              <XCircle size={11} />
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Schedule Highlight Box */}
                      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block">
                            {booking.formattedDate || booking.bookingDate}
                          </span>
                        </div>
                        <div className="border-x border-slate-200 dark:border-slate-800 px-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot</span>
                          <span className="text-xs font-black text-purple-700 dark:text-purple-300 mt-0.5 block">
                            {booking.slotTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Party</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5 block flex items-center justify-center gap-1">
                            <Users size={12} className="text-slate-500" />
                            <span>{booking.guests} Guests</span>
                          </span>
                        </div>
                      </div>

                      {/* Locked Offer Badge */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TicketPercent size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {booking.offerTitle || "Dining Offer Locked"}
                          </span>
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                          {Number(booking.totalCoverCharge) > 0 ? `₹${booking.totalCoverCharge} Cover` : "Zero Cover"}
                        </span>
                      </div>

                      {/* Food Bill Status Added by Restaurant */}
                      {booking.billAmount ? (
                        <div className={cn(
                          "flex items-center justify-between p-2.5 rounded-2xl border",
                          isCompleted
                            ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                            : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/90 dark:border-emerald-800/80"
                        )}>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            {isCompleted ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> : <Receipt size={14} className="text-emerald-600 shrink-0" />}
                            <span>{isCompleted ? "Dining Bill Paid & Settled:" : "Dining Food Bill Added by Restaurant:"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                              ₹{Number(booking.billAmount).toLocaleString("en-IN")}
                            </span>
                            {isCompleted && (
                              <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                                PAID
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-amber-500 shrink-0" />
                            <span>Food bill not added yet by store</span>
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">Ask waiter to add bill</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="bg-slate-50/80 dark:bg-slate-950/80 px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPassBooking(booking)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-extrabold text-xs transition cursor-pointer"
                      >
                        Show Pass
                      </button>

                      <div className="flex items-center gap-2">
                        {!isCancelled && !isCompleted && (
                          <>
                            <button
                              type="button"
                              onClick={() => setCancellingBooking(booking)}
                              className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onPayBillForBooking) {
                                  onPayBillForBooking(booking);
                                } else {
                                  setPayingBooking(booking);
                                }
                              }}
                              className={cn(
                                "px-4 py-2 rounded-xl text-white font-black text-xs shadow-md flex items-center gap-1.5 active:scale-98 transition cursor-pointer",
                                booking.billAmount
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25"
                                  : "bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-purple-600/25"
                              )}
                            >
                              <span>{booking.billAmount ? `Pay bill (₹${Number(booking.billAmount).toLocaleString("en-IN")})` : "Pay bill now"}</span>
                              <ArrowRight size={13} />
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-black">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Payment Completed</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Refund: ₹{booking.refundAmount ?? booking.totalCoverCharge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Deals Tab Preview */
          <div className="py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-3.5 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900">
              <TicketPercent size={28} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No Active Vouchers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Explore flash deals and redeem instant discount vouchers on total billing.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToDiscover}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 active:scale-98 transition cursor-pointer"
            >
              <span>Browse Deals</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Full Reservation Pass Right-Side Drawer */}
      {selectedPassBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedPassBooking(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 font-['Manrope']">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 flex items-center justify-center font-bold">
                    <UtensilsCrossed size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      PINAK Reservation Pass
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ref #{selectedPassBooking.bookingRef}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPassBooking(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* 4-Digit Check-In PIN Card */}
                <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                      Arrival Check-In PIN
                    </span>
                    <span className="text-2xl font-mono font-black text-purple-900 dark:text-purple-200 tracking-wider">
                      {selectedPassBooking.verificationCode || "8492"}
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold text-right max-w-[150px]">
                    Show this PIN or pass to the host at the restaurant
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl space-y-2.5 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Restaurant:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedPassBooking.storeName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Address:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right max-w-[200px] truncate">
                      {selectedPassBooking.storeAddress}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Date &amp; Slot:</span>
                    <span className="font-black text-purple-700 dark:text-purple-300">
                      {selectedPassBooking.formattedDate || selectedPassBooking.bookingDate} at {selectedPassBooking.slotTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Party Size:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedPassBooking.guests} Guests ({selectedPassBooking.mealType || "DINE-IN"})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Locked Deal:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedPassBooking.offerTitle}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Cover Charge:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{selectedPassBooking.totalCoverCharge || 0} ({selectedPassBooking.paymentStatus || "PAID"})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>How to redeem on table:</span>
                  </p>
                  <p className="leading-relaxed">
                    1. Arrive on time at {selectedPassBooking.storeName}. Show this pass to your host.
                  </p>
                  <p className="leading-relaxed">
                    2. Settle your final dining bill through PINAK to auto-redeem cover charges &amp; unlock offer discount.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPassBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>

                {selectedPassBooking.status === "COMPLETED" ? (
                  <div className="flex-1 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center font-black text-xs inline-flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Bill Settled &amp; Paid</span>
                  </div>
                ) : !selectedPassBooking.isCancelled && (
                  <button
                    type="button"
                    onClick={() => {
                      const booking = selectedPassBooking;
                      setSelectedPassBooking(null);
                      if (onPayBillForBooking) {
                        onPayBillForBooking(booking);
                      } else {
                        setPayingBooking(booking);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-98 transition cursor-pointer"
                  >
                    Pay Bill Now
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* 5. Cancel Confirmation Right-Side Drawer */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCancellingBooking(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 font-['Manrope']">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      Cancel Table Reservation
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ref #{cancellingBooking.bookingRef}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-200 space-y-1 leading-relaxed">
                  <p className="font-bold text-rose-700 dark:text-rose-300">
                    Cancel reservation at {cancellingBooking.storeName}?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Table reserved for {cancellingBooking.guests} guests on {cancellingBooking.formattedDate || cancellingBooking.bookingDate} at {cancellingBooking.slotTime}.
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center text-xs">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                    100% Instant Refund: ₹{cancellingBooking.totalCoverCharge || 0}
                  </span>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Will be credited back to your original payment method.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Reason for cancellation *
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  >
                    <option value="Change of plans">Change of plans</option>
                    <option value="Booked another restaurant">Booked another restaurant</option>
                    <option value="Guest count changed">Guest count changed</option>
                    <option value="Selected wrong date or time">Selected wrong date or time</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Keep Booking
                </button>

                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 active:scale-98 transition cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersView;
