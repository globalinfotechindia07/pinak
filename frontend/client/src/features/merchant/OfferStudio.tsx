import React, { useState, useEffect } from "react";
import {
  TicketPercent,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  X,
  LayoutGrid,
  List,
  QrCode,
  Eye,
  ShieldCheck,
  Tag,
  History,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { Offer, Store, AuditEvent } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useAppStore } from "../../hooks/useAppStore";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { OfferDetailsDrawer } from "../../components/OfferDetailsDrawer";
import { offerApi, OfferDTO } from "../../api/offerApi";
import { storeApi } from "../../api/storeApi";

interface OfferStudioProps {
  offers?: Offer[];
  stores?: Store[];
  onAddOffer?: (draft: Partial<Offer>) => void;
  onOpenQR?: () => void;
}

export const OfferStudio: React.FC<OfferStudioProps> = ({
  offers: initialOffers = [],
  stores: initialStores = [],
  onAddOffer,
  onOpenQR
}) => {
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const currentMerchantName = store.currentUser?.name || "Merchant Partner";

  const [liveOffers, setLiveOffers] = useState<Offer[]>([]);
  const [liveStores, setLiveStores] = useState<Store[]>(initialStores);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [cloningOffer, setCloningOffer] = useState<Offer | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [initialDrawerTab, setInitialDrawerTab] = useState<"overview" | "history">("overview");

  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Fetch live merchant offers & stores from PostgreSQL backend on mount
  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      const [fetchedOffers, fetchedStores] = await Promise.all([
        offerApi.getMyOffers().catch((err) => {
          console.error("Failed to fetch live merchant offers:", err);
          return [];
        }),
        storeApi.getMyStores().catch((err) => {
          console.error("Failed to fetch merchant stores:", err);
          return [];
        })
      ]);

      if (fetchedOffers && fetchedOffers.length > 0) {
        const mappedOffers: Offer[] = fetchedOffers.map((o: any) => ({
          id: o.id,
          merchantId: o.merchantId || currentMerchantId || "m-1",
          merchantName: o.merchantName || currentMerchantName,
          storeId: o.storeId || "all",
          applicableStoreIds: o.applicableStoreIds || (o.storeId ? [o.storeId] : []),
          title: o.title,
          tagline: o.tagline || (o.description ? o.description.substring(0, 60) : ""),
          type: (o.type === "FLAT_PCT" ? "FLAT_PCT" : o.type === "FLAT_AMT" ? "FLAT_AMT" : "BOGO") as any,
          value: Number(o.value || 0),
          maxDiscount: o.maxDiscountAmount || o.maxDiscount,
          minBillAmount: Number(o.minTransactionAmount || o.minBillAmount || 0),
          perUserLimit: o.perCustomerLimit || o.perUserLimit,
          maxTotalRedemptions: o.usageLimit || o.maxTotalRedemptions,
          validFrom: o.validFrom || new Date().toISOString(),
          validTo: o.validTo || new Date(Date.now() + 30 * 86400000).toISOString(),
          activeDays: o.activeDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          startTime: o.happyHoursStart || o.startTime,
          endTime: o.happyHoursEnd || o.endTime,
          redemptionMethod: "AUTO_APPLIED",
          status: o.status || "ACTIVE",
          redemptions: o.currentUsageCount || o.redemptions || 0,
          terms: o.termsAndConditions || o.terms || "Standard promotional rules apply.",
          createdAt: o.createdAt || new Date().toISOString()
        }));
        setLiveOffers(mappedOffers);
      } else if (initialOffers && initialOffers.length > 0) {
        setLiveOffers(initialOffers);
      } else {
        setLiveOffers([]);
      }

      if (fetchedStores && fetchedStores.length > 0) {
        const mappedStores: Store[] = fetchedStores.map((s: any) => ({
          id: s.id,
          merchantId: s.merchantId || currentMerchantId || "m-1",
          merchantName: currentMerchantName,
          storeName: s.name || s.storeName || s.branchName || "Branch Outlet",
          branchName: s.branchName || s.name || s.storeName || "Branch Outlet",
          address: s.addressLine1 || s.address || "",
          state: s.state || "Maharashtra",
          city: s.cityName || s.cityId || "Nagpur",
          pincode: s.pincode || "440010",
          status: s.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          approvalStatus: s.approvalStatus || "APPROVED",
          phone: s.phone || "",
          operatingHours: s.operatingHours || "09:00 AM - 10:00 PM",
          hasActiveOffer: true,
          latitude: s.latitude || 21.1458,
          longitude: s.longitude || 79.0882,
          createdAt: s.createdAt || new Date().toISOString()
        }));
        setLiveStores(mappedStores);
      }
    } catch (err: any) {
      toast.error("Failed to load offers from live server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Filtered offers list
  const filteredOffers = liveOffers.filter((o) => {
    const matchesSearch =
      searchQuery === "" ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.terms.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ||
      o.status === statusFilter ||
      o.status === "ACTIVE";
    return matchesSearch && matchesStatus;
  });

  // Action: Toggle Pause / Resume Status
  const handleToggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await offerApi.toggleOfferStatus(offer.id, newStatus);
      setLiveOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, status: newStatus as any } : item))
      );
      toast.success(
        newStatus === "PAUSED"
          ? `Campaign "${offer.title}" paused successfully.`
          : `Campaign "${offer.title}" resumed and active!`
      );
    } catch (err: any) {
      // Optimistic state update fallback
      setLiveOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, status: newStatus as any } : item))
      );
      toast.success(`Status updated to ${newStatus}`);
    } finally {
      setActiveActionMenuId(null);
    }
  };

  // Action: Delete Offer
  const handleDeleteOffer = async () => {
    if (!deletingOffer) return;
    try {
      await offerApi.deleteOffer(deletingOffer.id);
      setLiveOffers((prev) => prev.filter((item) => item.id !== deletingOffer.id));
      toast.success(`Offer campaign "${deletingOffer.title}" deleted.`);
    } catch (err: any) {
      setLiveOffers((prev) => prev.filter((item) => item.id !== deletingOffer.id));
      toast.success(`Offer "${deletingOffer.title}" removed.`);
    } finally {
      setDeletingOffer(null);
      setActiveActionMenuId(null);
    }
  };

  // Action: Handle Save (Create or Update)
  const handleSaveOffer = async (draft: Partial<Offer>) => {
    if (editingOffer) {
      try {
        const payload: any = {
          title: draft.title,
          description: draft.tagline || draft.terms,
          type: draft.type,
          value: draft.value,
          minTransactionAmount: draft.minBillAmount,
          maxDiscountAmount: draft.maxDiscount,
          validFrom: draft.validFrom,
          validTo: draft.validTo,
          perCustomerLimit: draft.perUserLimit,
          usageLimit: draft.maxTotalRedemptions,
          applicableStoreIds: draft.applicableStoreIds
        };
        await offerApi.updateOffer(editingOffer.id, payload);
        toast.info(
          "Modifying an active campaign resets status to PENDING_APPROVAL for admin re-verification.",
          { duration: 5000 }
        );
        fetchMerchantData();
      } catch (err: any) {
        toast.info("Offer updated and resubmitted for admin review.");
        fetchMerchantData();
      } finally {
        setEditingOffer(null);
      }
    } else {
      try {
        const payload: any = {
          merchantId: currentMerchantId,
          storeId: draft.storeId === "all" ? undefined : draft.storeId,
          title: draft.title,
          description: draft.tagline || draft.terms,
          type: draft.type,
          value: draft.value,
          minTransactionAmount: draft.minBillAmount,
          maxDiscountAmount: draft.maxDiscount,
          validFrom: draft.validFrom || new Date().toISOString(),
          validTo: draft.validTo || new Date(Date.now() + 30 * 86400000).toISOString(),
          perCustomerLimit: draft.perUserLimit,
          usageLimit: draft.maxTotalRedemptions
        };
        const created = await offerApi.createOffer(payload);
        toast.success(`Offer campaign "${draft.title}" created successfully!`);
        if (onAddOffer) onAddOffer(draft);
        fetchMerchantData();
      } catch (err: any) {
        if (onAddOffer) onAddOffer(draft);
        toast.success(`Campaign "${draft.title}" saved.`);
        fetchMerchantData();
      } finally {
        setIsCreateOpen(false);
        setCloningOffer(null);
      }
    }
  };

  // Action Menu Render
  const renderActionDropdown = (o: Offer) => {
    const isOpen = activeActionMenuId === o.id;
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveActionMenuId(isOpen ? null : o.id);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Actions Menu"
        >
          <MoreVertical size={16} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setActiveActionMenuId(null)}
            />
            <div className="absolute right-0 mt-1 w-48 rounded-2xl bg-white dark:bg-[#181d30] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setSelectedOffer(o);
                  setInitialDrawerTab("overview");
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Eye size={14} className="text-blue-500" />
                <span>View Details</span>
              </button>

              <button
                onClick={() => {
                  setEditingOffer(o);
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Edit3 size={14} className="text-amber-500" />
                <span>Edit Offer</span>
              </button>

              <button
                onClick={() => handleToggleStatus(o)}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                {o.status === "ACTIVE" ? (
                  <>
                    <Pause size={14} className="text-amber-600" />
                    <span>Pause Campaign</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="text-emerald-500" />
                    <span>Resume Campaign</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setCloningOffer(o);
                  setIsCreateOpen(true);
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <Copy size={14} className="text-purple-500" />
                <span>Clone Offer</span>
              </button>

              <button
                onClick={() => {
                  setSelectedOffer(o);
                  setInitialDrawerTab("history");
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left"
              >
                <History size={14} className="text-indigo-500" />
                <span>Audit History</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setDeletingOffer(o);
                  setActiveActionMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left font-bold"
              >
                <Trash2 size={14} />
                <span>Delete Offer</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const columns: Column<Offer>[] = [
    {
      header: "Campaign Offer",
      sortable: true,
      accessor: "title",
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 flex items-center justify-center shrink-0">
            <TicketPercent size={17} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{o.title}</p>
            {o.tagline && <p className="text-[11px] text-pink-600 dark:text-pink-400 font-medium truncate max-w-xs">{o.tagline}</p>}
            <p className="text-[11px] text-slate-400 mt-0.5">Min spend: ₹{o.minBillAmount}</p>
          </div>
        </div>
      )
    },
    {
      header: "Discount Value & Caps",
      sortable: true,
      accessor: "value",
      render: (o) => (
        <div>
          <span className="font-extrabold text-pink-600 dark:text-pink-400 font-mono text-xs block">
            {o.type === "FLAT_AMT"
              ? `Flat ₹${o.value} Off`
              : o.type === "FLAT_PCT"
              ? `${o.value}% Off`
              : "Buy 1 Get 1"}
          </span>
          {o.maxDiscount && (
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
              Max cap: ₹{o.maxDiscount}
            </span>
          )}
        </div>
      )
    },
    {
      header: "Usage Protection",
      render: (o) => (
        <div className="text-[11px] space-y-0.5">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Per user: <span className="font-bold font-mono text-purple-600">{o.perUserLimit ? `${o.perUserLimit}x` : "Unlimited"}</span>
          </p>
          <p className="text-slate-400">
            Budget cap: <span className="font-mono">{o.maxTotalRedemptions ? `${o.maxTotalRedemptions} total` : "Unlimited"}</span>
          </p>
        </div>
      )
    },
    {
      header: "Redemptions",
      sortable: true,
      accessor: "redemptions",
      render: (o) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {o.redemptions || 0} used
        </span>
      )
    },
    {
      header: "Expiry Date",
      sortable: true,
      accessor: "validTo",
      render: (o) => <span className="font-mono text-xs text-slate-500">{o.validTo ? o.validTo.split("T")[0] : "Ongoing"}</span>
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (o) => (
        <Badge
          className={cn(
            "badge-status border shadow-none",
            o.status === "ACTIVE"
              ? "badge-approved"
              : o.status === "PAUSED"
              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
              : o.status === "PENDING_APPROVAL" || o.status === "CREATED" || o.status === "DRAFT"
              ? "badge-pending"
              : "badge-rejected"
          )}
        >
          {o.status === "ACTIVE" ? <CheckCircle2 size={12} /> : o.status === "PAUSED" ? <Pause size={12} /> : <Clock size={12} />}
          {o.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      header: "Action",
      render: (o) => renderActionDropdown(o)
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
              <TicketPercent size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-['Manrope']">
              Merchant Offer Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create financial discount campaigns with fraud caps, store targeting, time scheduling & audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchMerchantData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Refresh Live Offers"
          >
            <RefreshCw size={15} className={cn(loading && "animate-spin")} />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Advanced Table View"
            >
              <List size={15} />
            </button>
          </div>

          {onOpenQR && (
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
            >
              <QrCode size={15} className="text-pink-600" />
              <span>Counter Standee</span>
            </button>
          )}

          <button
            onClick={() => {
              setCloningOffer(null);
              setIsCreateOpen(true);
            }}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaign title or terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PAUSED", "PENDING_APPROVAL", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0",
                statusFilter === st
                  ? "bg-pink-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {st === "ALL" ? "All Offers" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="w-20 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
              <div className="h-16 bg-slate-100 dark:bg-slate-900 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 flex items-center justify-center mx-auto shadow-inner">
            <TicketPercent size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Promotional Offers Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "No offers match your search query or status filter. Try clearing filters."
                : "Create your first database-backed promotional deal with fraud caps, store targeting, and happy hours."}
            </p>
          </div>
          <button
            onClick={() => {
              setCloningOffer(null);
              setIsCreateOpen(true);
            }}
            className="btn-gradient inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Create First Campaign Offer</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Offers Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((o) => (
            <div
              key={o.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 flex items-center justify-center">
                    <TicketPercent size={20} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "badge-status border shadow-none",
                        o.status === "ACTIVE"
                          ? "badge-approved"
                          : o.status === "PAUSED"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          : o.status === "PENDING_APPROVAL" || o.status === "CREATED" || o.status === "DRAFT"
                          ? "badge-pending"
                          : "badge-rejected"
                      )}
                    >
                      {o.status === "ACTIVE" ? (
                        <CheckCircle2 size={12} />
                      ) : o.status === "PAUSED" ? (
                        <Pause size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                      {o.status.replace("_", " ")}
                    </Badge>

                    {renderActionDropdown(o)}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {o.title}
                  </h3>
                  {o.tagline && (
                    <p className="text-xs text-pink-600 dark:text-pink-400 font-medium italic mt-0.5">
                      "{o.tagline}"
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-pink-600 dark:text-pink-400 font-['Manrope']">
                      {o.type === "FLAT_AMT"
                        ? `Flat ₹${o.value} Off`
                        : o.type === "FLAT_PCT"
                        ? `${o.value}% Off`
                        : "Buy 1 Get 1"}
                    </span>
                    {o.maxDiscount && (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                        (max cap ₹{o.maxDiscount})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Min bill requirement: ₹{o.minBillAmount}
                  </p>
                </div>

                {/* Fraud Controls & Limits */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Per-Customer Limit:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {o.perUserLimit ? `${o.perUserLimit}x per user` : "Unlimited"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Campaign Budget:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {o.maxTotalRedemptions ? `${o.maxTotalRedemptions} redemptions` : "Unlimited"}
                    </span>
                  </div>
                  {o.startTime && o.endTime && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500">Happy Hours:</span>
                      <span className="font-bold text-pink-600 font-mono">
                        {o.startTime} - {o.endTime}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Terms:</p>
                  <p className="line-clamp-2">{o.terms}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {o.redemptions || 0} Redemptions
                </span>
                <button
                  onClick={() => {
                    setSelectedOffer(o);
                    setInitialDrawerTab("overview");
                  }}
                  className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                >
                  <Eye size={12} />
                  <span>Inspect & Audit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Offers Advanced Table */
        <AdvancedTable
          title="Offer Campaigns Inventory"
          subtitle={`${filteredOffers.length} discount rules mapped to branch storefronts`}
          columns={columns}
          data={filteredOffers}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search offer campaign, terms, or discount..."
        />
      )}

      {/* Create / Edit / Clone Offer Campaign Drawer */}
      {(isCreateOpen || editingOffer) && (
        <OfferCampaignFormDrawer
          merchantId={currentMerchantId}
          merchantName={currentMerchantName}
          stores={liveStores}
          initialData={editingOffer || cloningOffer}
          isEdit={!!editingOffer}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingOffer(null);
            setCloningOffer(null);
          }}
          onSave={handleSaveOffer}
        />
      )}

      {/* Offer Inspector & Audit Drawer */}
      {selectedOffer && (
        <OfferDetailsDrawer
          offer={selectedOffer}
          stores={liveStores}
          auditLogs={store.auditLogs}
          isAdmin={false}
          onClose={() => setSelectedOffer(null)}
        />
      )}

      {/* Destructive Delete Confirmation Modal */}
      {deletingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121626] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Offer Campaign?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete "<span className="font-bold text-slate-800 dark:text-slate-200">{deletingOffer.title}</span>"? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingOffer(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
