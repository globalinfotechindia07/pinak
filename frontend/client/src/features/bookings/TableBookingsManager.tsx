import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarClock,
  Search,
  Filter,
  RefreshCw,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Phone,
  Store as StoreIcon,
  DollarSign,
  Calendar,
  UtensilsCrossed,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building2,
  Hash,
  Receipt,
  Download,
  MapPin,
  TicketPercent,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  MoreVertical,
  Copy,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { TableBookingDetails } from "@/api/tableBookingApi";
import tableBookingApi from "@/api/tableBookingApi";
import { useAppStore } from "@/hooks/useAppStore";
import { AdvancedTable, Column } from "@/components/ui/AdvancedTable";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TableBookingsManagerProps {
  role: "admin" | "merchant" | "store";
  scopedStoreId?: string;
}

export const TableBookingsManager: React.FC<TableBookingsManagerProps> = ({
  role = "admin",
  scopedStoreId
}) => {
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const activeStoreId = scopedStoreId || store.activeStoreId;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>(
    role === "store" && activeStoreId ? activeStoreId : "ALL"
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [bookings, setBookings] = useState<TableBookingDetails[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<TableBookingDetails | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Bill Modal states
  const [billModalBooking, setBillModalBooking] = useState<TableBookingDetails | null>(null);
  const [billAmountToSet, setBillAmountToSet] = useState<string>("");
  const [isSettingBill, setIsSettingBill] = useState<boolean>(false);

  // Cancellation Modal states
  const [cancellingBooking, setCancellingBooking] = useState<TableBookingDetails | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("Guest Request / Change of Plans");
  const [cancelComments, setCancelComments] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // View Mode: Table or Cards (persisted in localStorage)
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinak_bookings_view_mode");
      if (saved === "table" || saved === "cards") return saved;
    }
    return "table";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pinak_bookings_view_mode", viewMode);
    }
  }, [viewMode]);

  // Card view search and pagination
  const [cardSearch, setCardSearch] = useState<string>("");
  const [cardPage, setCardPage] = useState<number>(1);
  const cardPageSize = 9;

  useEffect(() => {
    setCardPage(1);
  }, [cardSearch, statusFilter, dateFilter, selectedStoreFilter]);

  // Available Stores list
  const availableStores = useMemo(() => {
    if (role === "admin") {
      return store.stores;
    }
    if (role === "merchant") {
      return store.stores.filter(
        (s) => !currentMerchantId || s.merchantId === currentMerchantId || s.merchantId === "m-1"
      );
    }
    return store.stores.filter((s) => s.id === activeStoreId);
  }, [role, store.stores, currentMerchantId, activeStoreId]);

  // Load bookings from backend
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const targetStoreId: string | undefined =
        role === "store" && activeStoreId
          ? String(activeStoreId)
          : selectedStoreFilter !== "ALL"
          ? selectedStoreFilter
          : undefined;

      const targetMerchantId =
        role === "merchant" && !targetStoreId && currentMerchantId
          ? String(currentMerchantId)
          : undefined;

      const data = await tableBookingApi.listBookings({
        storeId: targetStoreId,
        merchantId: targetMerchantId,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: searchQuery ? searchQuery.trim() : undefined
      });

      setBookings(data || []);
    } catch (err) {
      console.error("Failed to load table bookings:", err);
      toast.error("Could not load table bookings from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, selectedStoreFilter, role, activeStoreId]);

  // Handle status update (e.g. SEATED, COMPLETED, CANCELLED)
  const handleUpdateStatus = async (
    booking: TableBookingDetails,
    newStatus: string,
    reason?: string,
    comments?: string
  ) => {
    setStatusUpdatingId(booking.bookingRef);
    try {
      const updated = await tableBookingApi.updateStatus(booking.bookingRef, newStatus, reason, comments);
      toast.success(`Booking #${booking.bookingRef} marked as ${newStatus}`);
      await fetchBookings();
      if (selectedBooking && selectedBooking.bookingRef === booking.bookingRef) {
        setSelectedBooking(updated || { ...selectedBooking, status: newStatus });
      }
    } catch (err: any) {
      console.error("Failed to update booking status:", err);
      toast.error("Failed to update status. Please try again.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Handle adding/updating food bill amount by store
  const handleSetBillAmount = async (booking: TableBookingDetails, amountNum: number) => {
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid bill amount greater than 0");
      return;
    }
    setIsSettingBill(true);
    try {
      const updated = await tableBookingApi.setBillAmount(booking.bookingRef, amountNum);
      toast.success(`Food bill ₹${amountNum.toLocaleString("en-IN")} attached to Booking #${booking.bookingRef}`, {
        description: "The guest can now view and pay this exact bill amount from their app."
      });
      setBillModalBooking(null);
      setBillAmountToSet("");
      await fetchBookings();
      if (selectedBooking && selectedBooking.bookingRef === booking.bookingRef) {
        setSelectedBooking(updated);
      }
    } catch (err: any) {
      console.error("Failed to set bill amount:", err);
      toast.error("Failed to set bill amount. Please try again.");
    } finally {
      setIsSettingBill(false);
    }
  };

  // Handle cancellation modal submission
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await handleUpdateStatus(cancellingBooking, "CANCELLED", cancelReason, cancelComments);
      setCancellingBooking(null);
      setCancelReason("Guest Request / Change of Plans");
      setCancelComments("");
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered in memory for instant tab and search filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status?.toUpperCase() !== statusFilter) {
        return false;
      }
      if (dateFilter === "TODAY") {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (b.bookingDate !== todayStr) return false;
      } else if (dateFilter === "TOMORROW") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomStr = d.toISOString().slice(0, 10);
        if (b.bookingDate !== tomStr) return false;
      }
      if (selectedStoreFilter !== "ALL" && b.storeId !== selectedStoreFilter) {
        return false;
      }
      return true;
    });
  }, [bookings, statusFilter, dateFilter, selectedStoreFilter]);

// Card search matching helper
  const matchBookingSearch = (b: TableBookingDetails, query: string) => {
    if (!query || !query.trim()) return true;
    const q = query.toLowerCase().trim();
    return Boolean(
      b.bookingRef?.toLowerCase().includes(q) ||
      b.customerName?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.storeName?.toLowerCase().includes(q) ||
      b.slotTime?.toLowerCase().includes(q) ||
      b.offerTitle?.toLowerCase().includes(q) ||
      b.bookingDate?.includes(q) ||
      b.mealType?.toLowerCase().includes(q)
    );
  };

  const filteredCardBookings = useMemo(() => {
    return filteredBookings.filter((b) => matchBookingSearch(b, cardSearch));
  }, [filteredBookings, cardSearch]);

  const totalCardPages = Math.ceil(filteredCardBookings.length / cardPageSize) || 1;
  const paginatedCardBookings = useMemo(() => {
    const start = (cardPage - 1) * cardPageSize;
    return filteredCardBookings.slice(start, start + cardPageSize);
  }, [filteredCardBookings, cardPage, cardPageSize]);

  // Aggregate Metrics
  const totalBookings = bookings.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((b) => b.bookingDate === todayStr).length;
  const seatedCount = bookings.filter((b) => b.status === "SEATED").length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;
  const totalGuests = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + (b.guests || 2), 0);
  const totalBillAmount = bookings
    .filter((b) => b.status !== "CANCELLED" && b.billAmount)
    .reduce((sum, b) => sum + Number(b.billAmount || 0), 0);

  // Advanced Table Columns Configuration
  const columns: Column<TableBookingDetails>[] = useMemo(() => {
    const cols: Column<TableBookingDetails>[] = [
      {
        header: "Booking Ref",
        sortable: true,
        accessor: "bookingRef",
        className: "w-[130px]",
        render: (b) => (
          <div className="font-mono text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Hash size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate">{b.bookingRef}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 font-sans">
                {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : ""}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold font-sans uppercase">
                {b.mealType || "DINE-IN"}
              </span>
            </div>
          </div>
        )
      },
      {
        header: "Guest Details",
        sortable: true,
        accessor: "customerName",
        className: "w-[155px]",
        render: (b) => (
          <div className="text-xs">
            <p className="font-extrabold text-slate-900 dark:text-white truncate">
              {b.customerName || "Guest Diner"}
            </p>
            <a
              href={`tel:${b.customerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-0.5 font-medium truncate"
            >
              <Phone size={10} className="shrink-0" />
              <span>{b.customerPhone}</span>
            </a>
          </div>
        )
      }
    ];

    if (role !== "store") {
      cols.push({
        header: "Restaurant Outlet",
        sortable: true,
        accessor: "storeName",
        className: "w-[175px]",
        render: (b) => (
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {b.storeName || "Partner Restaurant"}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
              <MapPin size={10} className="shrink-0 text-slate-400" />
              <span className="truncate">{b.storeAddress || "Central Branch"}</span>
            </p>
          </div>
        )
      });
    }

    cols.push(
      {
        header: "Date & Slot",
        sortable: true,
        accessor: (b) => `${b.bookingDate} ${b.slotTime}`,
        className: "w-[145px]",
        render: (b) => (
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              {b.formattedDate || b.bookingDate}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded text-[10px]">
                {b.slotTime}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <Users size={11} className="text-slate-400" />
                <span>{b.guests || 2}p</span>
              </span>
            </div>
          </div>
        )
      },
      {
        header: "Offer & Cover",
        accessor: "offerTitle",
        className: "w-[155px]",
        render: (b) => (
          <div className="text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {b.offerTitle || "Standard Reservation"}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Number(b.totalCoverCharge) > 0 ? `₹${b.totalCoverCharge} Cover` : "Zero Cover"}
              </span>
              {b.includeVipPlan && (
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1 rounded font-black text-[9px]">
                  VIP 🪙
                </span>
              )}
            </div>
          </div>
        )
      },
      {
        header: "Dining Food Bill",
        sortable: true,
        accessor: (b) => Number(b.billAmount || 0),
        className: "w-[130px]",
        render: (b) => (
          <div className="text-xs">
            {b.status?.toUpperCase() === "COMPLETED" ? (
              <div>
                <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                  ₹{Number(b.billAmount || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={11} className="shrink-0" />
                  <span>Bill Paid &amp; Settled</span>
                </span>
              </div>
            ) : b.billAmount ? (
              <div>
                <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                  ₹{Number(b.billAmount).toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold block">
                  ✓ Ready for Pay
                </span>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  Not Added
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                  Pending Waiter
                </span>
              </div>
            )}
          </div>
        )
      },
      {
        header: "Status",
        sortable: true,
        accessor: "status",
        className: "w-[140px]",
        render: (b) => {
          const status = b.status?.toUpperCase() || "CONFIRMED";
          return (
            <Badge
              variant={
                status === "CONFIRMED"
                  ? "success"
                  : status === "SEATED"
                  ? "secondary"
                  : status === "COMPLETED"
                  ? "default"
                  : "destructive"
              }
              className={cn(
                "font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-1 inline-flex items-center gap-1",
                status === "CONFIRMED" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                status === "SEATED" && "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                status === "COMPLETED" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
                status === "CANCELLED" && "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              )}
            >
              {status === "CONFIRMED" && <CheckCircle2 size={11} />}
              {status === "SEATED" && <Users size={11} />}
              {status === "COMPLETED" && <ShieldCheck size={11} />}
              {status === "CANCELLED" && <XCircle size={11} />}
              <span>{status === "COMPLETED" ? "PAID • COMPLETED" : status}</span>
            </Badge>
          );
        }
      },
      {
        header: "Actions",
        className: "text-right w-[60px]",
        render: (b) => {
          const isCancelled = b.status?.toUpperCase() === "CANCELLED";
          const isCompleted = b.status?.toUpperCase() === "COMPLETED";
          const isSeated = b.status?.toUpperCase() === "SEATED";
          const isConfirmed = b.status?.toUpperCase() === "CONFIRMED";

          return (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 transition cursor-pointer shadow-2xs focus:outline-hidden"
                    title="Reservation Actions"
                  >
                    <MoreVertical size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                    Booking #{b.bookingRef}
                  </DropdownMenuLabel>

                  {/* 1. View Details */}
                  <DropdownMenuItem
                    onClick={() => setSelectedBooking(b)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                    <span>View Details</span>
                  </DropdownMenuItem>

                  {/* 2. Attach / Update Food Bill */}
                  {!isCancelled && !isCompleted && (
                    <DropdownMenuItem
                      onClick={() => {
                        setBillModalBooking(b);
                        setBillAmountToSet(b.billAmount ? String(b.billAmount) : "");
                      }}
                      className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{b.billAmount ? "Update Food Bill" : "Attach Food Bill"}</span>
                      </div>
                      {b.billAmount && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-black text-emerald-800 dark:text-emerald-300">
                          ₹{Number(b.billAmount).toLocaleString("en-IN")}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )}

                  {/* 3. Seat Guests (if CONFIRMED) */}
                  {!isCancelled && !isCompleted && isConfirmed && (
                    <DropdownMenuItem
                      disabled={statusUpdatingId === b.bookingRef}
                      onClick={() => handleUpdateStatus(b, "SEATED")}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      <Users size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>Seat Guests</span>
                    </DropdownMenuItem>
                  )}

                  {/* 4. Complete Reservation (if SEATED) */}
                  {!isCancelled && !isCompleted && isSeated && (
                    <DropdownMenuItem
                      disabled={statusUpdatingId === b.bookingRef}
                      onClick={() => handleUpdateStatus(b, "COMPLETED")}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    >
                      <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>Mark Completed</span>
                    </DropdownMenuItem>
                  )}

                  {/* 5. Copy Booking Reference */}
                  <DropdownMenuItem
                    onClick={() => {
                      navigator.clipboard.writeText(b.bookingRef);
                      toast.success(`Copied Booking Ref #${b.bookingRef}`);
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy size={14} className="text-slate-500" />
                    <span>Copy Booking Ref</span>
                  </DropdownMenuItem>

                  {/* 6. Call Guest */}
                  {b.customerPhone && (
                    <DropdownMenuItem
                      onClick={() => window.open(`tel:${b.customerPhone}`)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Phone size={14} className="text-slate-500" />
                      <span>Call Diner ({b.customerPhone})</span>
                    </DropdownMenuItem>
                  )}

                  {/* 7. Cancel Reservation */}
                  {!isCancelled && !isCompleted && (
                    <>
                      <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                      <DropdownMenuItem
                        onClick={() => setCancellingBooking(b)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <XCircle size={14} className="text-rose-600 dark:text-rose-400" />
                        <span>Cancel Reservation</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
      }
    );

    return cols;
  }, [role, statusUpdatingId]);

  // Custom Beautiful Empty State for Reservations Table
  const tableEmptyState = useMemo(() => {
    const hasFiltersApplied =
      Boolean(searchQuery && searchQuery.trim() !== "") ||
      statusFilter !== "ALL" ||
      dateFilter !== "ALL" ||
      selectedStoreFilter !== "ALL";

    if (hasFiltersApplied && bookings.length > 0) {
      return (
        <div className="py-12 sm:py-16 px-4 max-w-md mx-auto text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto shadow-md">
            <Filter size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              No Matching Reservations Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We couldn't find any reservations matching your active search or filters. Try adjusting your query or resetting all filters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
              setDateFilter("ALL");
              setSelectedStoreFilter("ALL");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-xs transition cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Reset All Filters</span>
          </button>
        </div>
      );
    }

    // Pure zero records state (fresh database / no bookings logged)
    return (
      <div className="py-12 sm:py-16 px-4 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Layered glowing badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-purple-600/25 ring-8 ring-purple-100 dark:ring-purple-950/40">
            <UtensilsCrossed size={36} className="stroke-[2.2]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
            <Sparkles size={14} />
          </div>
        </div>

        {/* Text Copy */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            No Dine-In Reservations Logged Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your live reservation engine is active and awaiting guest bookings. When customers pre-book a dining slot from the PINAK app or web portal, their table details, party size, cover charges, and food bills will stream here in real time.
          </p>
        </div>

        {/* 3 Live Architecture Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Slot Engine</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Enforces configured meal slots, party capacities, and automatic 15-minute grace windows.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Host Seating Desk</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Verify 4-digit arrival PINs, seat guests immediately, and track dining turnaround times.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt size={16} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Food Billing</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Host attaches the actual dining bill amount so diners can pay directly in-app.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 active:scale-98 transition cursor-pointer"
          >
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            <span>Refresh Live Feed</span>
          </button>
        </div>
      </div>
    );
  }, [searchQuery, statusFilter, dateFilter, selectedStoreFilter, bookings.length, loading]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200 font-['Manrope']">
      {/* 1. Header Hero Card with Integrated Quick Filters */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-7 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[10.5px] font-black uppercase tracking-wider border border-purple-400/30">
              {role === "admin"
                ? "Platform Reservations Control"
                : role === "merchant"
                ? "Merchant Table Reservations"
                : "Branch Floor Reservations"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-[10.5px] font-black uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Slot Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Table Bookings &amp; Pre-Bookings
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
            {role === "admin"
              ? "Oversee live diner table reservations, cover charges, slot utilization, and attached food bills across all restaurant partners."
              : role === "merchant"
              ? "Track guest party sizes, meal slots, pre-book offer redemptions, and table bill settlements across your outlets."
              : "Manage today's dining schedule, seat guests, attach final food bill amount, and verify reservation PINs."}
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          {/* Outlet Filter for Admin/Merchant */}
          {role !== "store" && availableStores.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 text-xs">
              <StoreIcon size={14} className="text-purple-300 shrink-0" />
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Stores ({availableStores.length})</option>
                {availableStores.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.storeName || s.branchName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Date Range Pills */}
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs">
            <button
              type="button"
              onClick={() => setDateFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs",
                dateFilter === "ALL" ? "bg-white text-purple-900 shadow-2xs" : "text-white/80 hover:text-white"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("TODAY")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs",
                dateFilter === "TODAY" ? "bg-white text-purple-900 shadow-2xs" : "text-white/80 hover:text-white"
              )}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("TOMORROW")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs",
                dateFilter === "TOMORROW" ? "bg-white text-purple-900 shadow-2xs" : "text-white/80 hover:text-white"
              )}
            >
              Tomorrow
            </button>
          </div>

          {/* View Mode Switcher in Hero */}
          <div className="flex items-center p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs",
                viewMode === "table" ? "bg-white text-purple-900 shadow-2xs" : "text-white/80 hover:text-white"
              )}
              title="Table View"
            >
              <List size={13} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs",
                viewMode === "cards" ? "bg-white text-purple-900 shadow-2xs" : "text-white/80 hover:text-white"
              )}
              title="Cards Grid View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs backdrop-blur-md transition cursor-pointer border border-white/15 shadow-2xs"
            title="Refresh bookings"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (5 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Bookings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Reservations</span>
            <CalendarClock size={16} className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalBookings}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">All logged bookings</p>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Today's Schedule</span>
            <Clock size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {todayCount}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Arriving today</p>
        </div>

        {/* Confirmed & Seated */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Active at Tables</span>
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {seatedCount + confirmedCount}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            {seatedCount} Seated • {confirmedCount} Confirmed
          </p>
        </div>

        {/* Total Covers / Guests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Expected Guests</span>
            <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {totalGuests}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Total dining covers</p>
        </div>

        {/* Food Bill Volume */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Food Bill Value</span>
            <Receipt size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            ₹{totalBillAmount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Attached table bills</p>
        </div>
      </div>

      {/* 3. Status Tabs Navigation & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "All Reservations", count: bookings.length },
            { id: "CONFIRMED", label: "Confirmed", count: confirmedCount },
            { id: "SEATED", label: "Seated", count: seatedCount },
            { id: "COMPLETED", label: "Completed", count: completedCount },
            { id: "CANCELLED", label: "Cancelled", count: cancelledCount }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border",
                statusFilter === tab.id
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Table or Cards */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Table View"
          >
            <List size={14} />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Card Grid View"
          >
            <LayoutGrid size={14} />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* 4. Main Content: Table View OR Cards View */}
      {viewMode === "table" ? (
        <AdvancedTable<TableBookingDetails>
          columns={columns}
          data={filteredBookings}
          keyExtractor={(b) => b.bookingRef || b.bookingId}
          searchPlaceholder="Filter reservations by guest name, phone, ref, slot, or restaurant..."
          searchFilter={(b, query) => {
            const q = query.toLowerCase();
            return Boolean(
              b.bookingRef?.toLowerCase().includes(q) ||
              b.customerName?.toLowerCase().includes(q) ||
              b.customerPhone?.includes(q) ||
              b.storeName?.toLowerCase().includes(q) ||
              b.slotTime?.toLowerCase().includes(q) ||
              b.offerTitle?.toLowerCase().includes(q)
            );
          }}
          title="Dine-In Reservations"
          subtitle={`Showing ${filteredBookings.length} matching reservations with live table billing integration.`}
          tableClassName="min-w-[960px]"
          defaultPageSize={10}
          emptyState={tableEmptyState}
          emptyMessage="No table reservations found matching your criteria. When customers pre-book a table, their reservation will show here."
          onRowClick={(b) => setSelectedBooking(b)}
        />
      ) : (
        /* Cards View */
        <div className="space-y-4">
          {/* Card Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search reservations by guest, phone, ref, slot, or restaurant..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {cardSearch && (
                <button
                  type="button"
                  onClick={() => setCardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end gap-2">
              <span>
                Showing <strong>{filteredCardBookings.length}</strong> of <strong>{filteredBookings.length}</strong> reservations
              </span>
              {(cardSearch || statusFilter !== "ALL" || dateFilter !== "ALL" || selectedStoreFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setCardSearch("");
                    setStatusFilter("ALL");
                    setDateFilter("ALL");
                    setSelectedStoreFilter("ALL");
                  }}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer ml-1"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCardBookings.length === 0 ? (
            tableEmptyState
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {paginatedCardBookings.map((b) => {
                  const status = b.status?.toUpperCase() || "CONFIRMED";
                  const isCancelled = status === "CANCELLED" || Boolean(b.isCancelled);
                  const isCompleted = status === "COMPLETED";
                  const isSeated = status === "SEATED";
                  const isConfirmed = status === "CONFIRMED";

                  return (
                    <div
                      key={b.bookingRef || b.bookingId}
                      onClick={() => setSelectedBooking(b)}
                      className={cn(
                        "p-5 rounded-3xl bg-white dark:bg-[#121626] border transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:shadow-xl relative",
                        isConfirmed && "border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600",
                        isSeated && "border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600",
                        isCompleted && "border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600",
                        isCancelled && "border-rose-200/70 dark:border-rose-950/60 hover:border-rose-300 opacity-80"
                      )}
                    >
                      {/* Card Header: Reference, Status Badge & Dropdown */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1">
                            <Hash size={12} className="text-purple-600 dark:text-purple-400" />
                            <span>{b.bookingRef}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(b.bookingRef);
                              toast.success(`Copied Booking Ref #${b.bookingRef}`);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Copy Booking Ref"
                          >
                            <Copy size={12} />
                          </button>
                        </div>

                        {/* Status Badge & Dropdown */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant={
                              status === "CONFIRMED"
                                ? "success"
                                : status === "SEATED"
                                ? "secondary"
                                : status === "COMPLETED"
                                ? "default"
                                : "destructive"
                            }
                            className={cn(
                              "font-extrabold uppercase tracking-wider text-[10px] px-2.5 py-0.5 inline-flex items-center gap-1",
                              status === "CONFIRMED" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                              status === "SEATED" && "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                              status === "COMPLETED" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
                              status === "CANCELLED" && "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            )}
                          >
                            {status === "CONFIRMED" && <CheckCircle2 size={10} />}
                            {status === "SEATED" && <Users size={10} />}
                            {status === "COMPLETED" && <ShieldCheck size={10} />}
                            {status === "CANCELLED" && <XCircle size={10} />}
                            <span>{status === "COMPLETED" ? "PAID" : status}</span>
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
                              >
                                <MoreVertical size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]">
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                                Booking #{b.bookingRef}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setSelectedBooking(b)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                              >
                                <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>View Details</span>
                              </DropdownMenuItem>
                              {!isCancelled && !isCompleted && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setBillModalBooking(b);
                                    setBillAmountToSet(b.billAmount ? String(b.billAmount) : "");
                                  }}
                                  className="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <div className="flex items-center gap-2">
                                    <Receipt size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>{b.billAmount ? "Update Food Bill" : "Attach Food Bill"}</span>
                                  </div>
                                  {b.billAmount && (
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-black text-emerald-800 dark:text-emerald-300">
                                      ₹{Number(b.billAmount).toLocaleString("en-IN")}
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {!isCancelled && !isCompleted && isConfirmed && (
                                <DropdownMenuItem
                                  disabled={statusUpdatingId === b.bookingRef}
                                  onClick={() => handleUpdateStatus(b, "SEATED")}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                >
                                  <Users size={14} className="text-blue-600 dark:text-blue-400" />
                                  <span>Seat Guests</span>
                                </DropdownMenuItem>
                              )}
                              {!isCancelled && !isCompleted && isSeated && (
                                <DropdownMenuItem
                                  disabled={statusUpdatingId === b.bookingRef}
                                  onClick={() => handleUpdateStatus(b, "COMPLETED")}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                >
                                  <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                                  <span>Mark Completed</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(b.bookingRef);
                                  toast.success(`Copied Booking Ref #${b.bookingRef}`);
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy size={14} className="text-slate-500" />
                                <span>Copy Booking Ref</span>
                              </DropdownMenuItem>
                              {b.customerPhone && (
                                <DropdownMenuItem
                                  onClick={() => window.open(`tel:${b.customerPhone}`)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Phone size={14} className="text-slate-500" />
                                  <span>Call Diner ({b.customerPhone})</span>
                                </DropdownMenuItem>
                              )}
                              {!isCancelled && !isCompleted && (
                                <>
                                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                  <DropdownMenuItem
                                    onClick={() => setCancellingBooking(b)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  >
                                    <XCircle size={14} className="text-rose-600 dark:text-rose-400" />
                                    <span>Cancel Reservation</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Diner Identity & Party Size */}
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black text-xs shrink-0">
                            {(b.customerName || "G").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {b.customerName || "Guest Diner"}
                            </h4>
                            {b.customerPhone && (
                              <a
                                href={`tel:${b.customerPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] font-mono text-slate-500 hover:text-purple-600 dark:text-slate-400 flex items-center gap-1 mt-0.5"
                              >
                                <Phone size={10} />
                                <span>{b.customerPhone}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-right space-y-1 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs border border-purple-200/60 dark:border-purple-800/60">
                            <Users size={12} />
                            <span>{b.guests || 2} Guests</span>
                          </span>
                          {b.verificationCode && (
                            <div className="text-[10px] font-mono text-slate-400 font-bold">
                              PIN: <span className="text-slate-800 dark:text-slate-200 font-black">{b.verificationCode}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slot Timing & Store Info Box */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <Calendar size={11} className="text-purple-600 dark:text-purple-400" />
                            <span>Date &amp; Slot</span>
                          </span>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
                            {b.formattedDate || b.bookingDate}
                          </p>
                          <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <Clock size={11} />
                            <span>{b.slotTime} ({b.mealType || "DINE-IN"})</span>
                          </p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <StoreIcon size={11} className="text-indigo-600 dark:text-indigo-400" />
                            <span>Restaurant</span>
                          </span>
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate" title={b.storeName}>
                            {b.storeName || "Partner Restaurant"}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1" title={b.offerTitle || "Standard Reservation"}>
                            <Sparkles size={10} className="text-amber-500 shrink-0" />
                            <span className="truncate">{b.offerTitle || "Standard Reservation"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Cover Charge & Dining Food Bill Status */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Cover Charge</span>
                          <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                            {Number(b.totalCoverCharge || 0) > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">
                                ₹{b.totalCoverCharge} Paid
                              </span>
                            ) : (
                              <span className="text-slate-400">FREE</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Dining Food Bill</span>
                          <div>
                            {status === "COMPLETED" ? (
                              <div className="flex items-center gap-1 justify-end font-black text-sm text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>₹{Number(b.billAmount || 0).toLocaleString("en-IN")}</span>
                              </div>
                            ) : b.billAmount ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                                  ₹{Number(b.billAmount).toLocaleString("en-IN")}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">Ready</span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                Pending Waiter
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Quick Action Buttons */}
                      <div className="pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isConfirmed && !isCancelled && !isCompleted && (
                          <>
                            <button
                              type="button"
                              disabled={statusUpdatingId === b.bookingRef}
                              onClick={() => handleUpdateStatus(b, "SEATED")}
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                            >
                              <Users size={13} />
                              <span>Seat Guests</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                            >
                              Details
                            </button>
                          </>
                        )}

                        {isSeated && !isCancelled && !isCompleted && (
                          <>
                            {!b.billAmount ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setBillModalBooking(b);
                                  setBillAmountToSet("");
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                              >
                                <Receipt size={13} />
                                <span>Attach Bill</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={statusUpdatingId === b.bookingRef}
                                onClick={() => handleUpdateStatus(b, "COMPLETED")}
                                className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                              >
                                <CheckCircle2 size={13} />
                                <span>Complete</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(b)}
                              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                            >
                              Details
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye size={13} className="text-purple-600" />
                            <span>View Settled Receipt</span>
                          </button>
                        )}

                        {isCancelled && (
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(b)}
                            className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle size={13} />
                            <span>Cancellation Info</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Pagination Bar */}
              {totalCardPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <strong className="text-slate-800 dark:text-white">{(cardPage - 1) * cardPageSize + 1}</strong> to <strong className="text-slate-800 dark:text-white">{Math.min(cardPage * cardPageSize, filteredCardBookings.length)}</strong> of <strong className="text-slate-800 dark:text-white">{filteredCardBookings.length}</strong> reservations
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCardPage((p) => Math.max(1, p - 1))}
                      disabled={cardPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft size={13} />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalCardPages }, (_, idx) => idx + 1)
                        .filter((p) => p === 1 || p === totalCardPages || Math.abs(p - cardPage) <= 1)
                        .map((p, index, array) => {
                          const prev = array[index - 1];
                          const hasGap = prev && p - prev > 1;

                          return (
                            <React.Fragment key={p}>
                              {hasGap && <span className="px-1 text-slate-400 text-xs">...</span>}
                              <button
                                type="button"
                                onClick={() => setCardPage(p)}
                                className={cn(
                                  "w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center",
                                  cardPage === p
                                    ? "bg-purple-600 text-white shadow-xs"
                                    : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCardPage((p) => Math.min(totalCardPages, p + 1))}
                      disabled={cardPage === totalCardPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 5. Attach / Update Food Bill Right-Side Drawer */}
      {billModalBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setBillModalBooking(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 font-['Manrope']">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      Attach Food Bill to Table
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ref #{billModalBooking.bookingRef} • {billModalBooking.guests || 2} Guests
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBillModalBooking(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Guest & Table Context Card */}
                <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Guest Name:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {billModalBooking.customerName || "Guest Diner"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Contact Phone:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {billModalBooking.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Dining Slot:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {billModalBooking.formattedDate || billModalBooking.bookingDate} • {billModalBooking.slotTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Party Size:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {billModalBooking.guests || 2} Guests ({billModalBooking.mealType || "DINE-IN"})
                    </span>
                  </div>
                </div>

                {/* Bill Amount Input Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Printed Food Bill Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      autoFocus
                      value={billAmountToSet}
                      onChange={(e) => setBillAmountToSet(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xl font-black text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter the gross bill amount printed from your register/POS. The diner will view this bill amount in their PINAK app to make the payment.
                  </p>
                </div>

                {/* Quick Preset Amount Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quick Select
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[500, 1000, 1500, 2000, 2500, 3000, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBillAmountToSet(String(amt))}
                        className={cn(
                          "px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border",
                          billAmountToSet === String(amt)
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700"
                        )}
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Host Tip / Notice */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="font-extrabold flex items-center gap-1.5">
                    <span>💡</span>
                    <span>Floor Host Notice</span>
                  </span>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Attach the full food bill amount before discounts. The customer will pay from their app and any eligible promo discounts will be applied automatically at checkout.
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillModalBooking(null)}
                  disabled={isSettingBill}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSettingBill || !billAmountToSet || Number(billAmountToSet) <= 0}
                  onClick={() => handleSetBillAmount(billModalBooking, Number(billAmountToSet))}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isSettingBill ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving Bill...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Attach Bill &amp; Send to Guest</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* 6. Reservation Details Right-Side Drawer */}
      {selectedBooking && (() => {
        const isSelectedCancelled = selectedBooking.status?.toUpperCase() === "CANCELLED" || Boolean(selectedBooking.isCancelled);
        const isSelectedCompleted = selectedBooking.status?.toUpperCase() === "COMPLETED";
        const isSelectedSeated = selectedBooking.status?.toUpperCase() === "SEATED";
        const isSelectedConfirmed = selectedBooking.status?.toUpperCase() === "CONFIRMED";

        return (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 font-['Manrope']">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-2xs">
                    <UtensilsCrossed size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 leading-tight">
                      <span>Reservation #{selectedBooking.bookingRef}</span>
                      <Badge variant={isSelectedConfirmed ? "success" : isSelectedSeated ? "secondary" : isSelectedCompleted ? "default" : "destructive"}>
                        {isSelectedCompleted ? "PAID • COMPLETED" : selectedBooking.status}
                      </Badge>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {selectedBooking.formattedDate || selectedBooking.bookingDate} • {selectedBooking.slotTime} ({selectedBooking.mealType || "DINE-IN"})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Diner & Table Details Card */}
                <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl space-y-2.5 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Restaurant Outlet:</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                      {selectedBooking.storeName || "Partner Restaurant"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Customer Name:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {selectedBooking.customerName || "Guest Diner"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Customer Phone:</span>
                    <a
                      href={`tel:${selectedBooking.customerPhone}`}
                      className="font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Phone size={11} />
                      <span>{selectedBooking.customerPhone}</span>
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Party Size:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {selectedBooking.guests || 2} Guests
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Pre-Book Offer:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedBooking.offerTitle || "Standard Reservation"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Cover Charge Paid:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{selectedBooking.totalCoverCharge || 0} ({selectedBooking.paymentStatus || "PAID"})
                    </span>
                  </div>

                  {/* Food Bill Row */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-slate-500 font-semibold">Dining Food Bill:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-emerald-700 dark:text-emerald-400">
                        {selectedBooking.billAmount ? `₹${Number(selectedBooking.billAmount).toLocaleString("en-IN")}` : "Not Added"}
                      </span>
                      {isSelectedCompleted ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          <span>PAID</span>
                        </span>
                      ) : !isSelectedCancelled && !isSelectedCompleted && (
                        <button
                          type="button"
                          onClick={() => {
                            setBillModalBooking(selectedBooking);
                            setBillAmountToSet(selectedBooking.billAmount ? String(selectedBooking.billAmount) : "");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition cursor-pointer"
                        >
                          {selectedBooking.billAmount ? "Edit Bill" : "+ Add Bill"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Special Requests / Notes
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}

                {/* Cancellation Info if cancelled */}
                {isSelectedCancelled && (
                  <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300 block">
                      Cancellation &amp; Refund
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 text-xs">
                      Reason: {selectedBooking.cancellationReason || "Customer requested"}
                    </p>
                    <p className="text-rose-600 dark:text-rose-400 text-xs font-bold">
                      Refund Amount: ₹{selectedBooking.refundAmount ?? selectedBooking.totalCoverCharge} ({selectedBooking.refundStatus || "REFUNDED"})
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSelectedCompleted && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Dining Bill Settled &amp; Paid</span>
                    </div>
                  )}
                  {!isSelectedCancelled && !isSelectedCompleted && isSelectedConfirmed && (
                    <button
                      type="button"
                      disabled={statusUpdatingId === selectedBooking.bookingRef}
                      onClick={() => handleUpdateStatus(selectedBooking, "SEATED")}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Seat Guests
                    </button>
                  )}
                  {!isSelectedCancelled && !isSelectedCompleted && isSelectedSeated && (
                    <button
                      type="button"
                      disabled={statusUpdatingId === selectedBooking.bookingRef}
                      onClick={() => handleUpdateStatus(selectedBooking, "COMPLETED")}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Complete
                    </button>
                  )}
                  {!isSelectedCancelled && !isSelectedCompleted && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancellingBooking(selectedBooking);
                        setSelectedBooking(null);
                      }}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </aside>
          </div>
        </div>
        );
      })()}

      {/* 7. Cancel Reservation Right-Side Drawer */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCancellingBooking(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 font-['Manrope']">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                      Cancel Table Reservation
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Ref #{cancellingBooking.bookingRef} • {cancellingBooking.customerName}
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

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-slate-700 dark:text-slate-200 space-y-1 leading-relaxed">
                  <p className="font-bold text-rose-700 dark:text-rose-300">
                    Are you sure you want to cancel this booking?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    If a cover charge was collected, 100% of the amount (₹{cancellingBooking.totalCoverCharge || 0}) will be refunded back to the diner immediately.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Guest Request / Change of Plans">Guest Request / Change of Plans</option>
                    <option value="Guest No-Show">Guest No-Show</option>
                    <option value="Restaurant Overbooked / Full Capacity">Restaurant Overbooked / Full Capacity</option>
                    <option value="Operational Emergency / Maintenance">Operational Emergency / Maintenance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={cancelComments}
                    onChange={(e) => setCancelComments(e.target.value)}
                    placeholder="Provide details or notes regarding this cancellation..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white focus:outline-hidden resize-none h-24"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isCancelling ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableBookingsManager;
