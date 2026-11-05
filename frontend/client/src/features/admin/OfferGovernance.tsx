import React, { useState } from "react";
import {
  TicketPercent,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  Download,
  Calendar,
  X,
  Layers,
  AlertCircle,
  Copy,
  Trash2,
  Play,
  Pause,
  Sparkles,
  LayoutGrid,
  List,
  ShoppingBag,
  Utensils,
  Zap,
  Coins,
  Tag,
  ArrowRight,
  Armchair,
  MoreVertical,
  Smartphone,
  MapPin,
  Store as StoreIcon,
  RefreshCw,
  QrCode,
  Edit3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Offer, Merchant, Store } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useAppStore } from "../../hooks/useAppStore";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { OfferDetailsDrawer } from "../../components/OfferDetailsDrawer";
import { getOfferBenefitInfo } from "../../lib/offerBenefitHelper";
import { offerApi } from "../../api/offerApi";

export interface OfferGovernanceProps {
  role?: "admin" | "merchant" | "store";
  scopedStoreId?: string;
  scopedMerchantId?: string;
  currentStore?: Store;
  offers?: Offer[];
  merchants?: Merchant[];
  stores?: Store[];
  onAddOffer?: (draft: Partial<Offer>) => Promise<any> | void;
  onUpdateOfferStatus?: (id: string, status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING_APPROVAL" | "PAUSED", reason?: string) => void | Promise<any>;
  onDeleteOffer?: (id: string) => void | Promise<any>;
  onCloneOffer?: (id: string) => void;
  onOpenQR?: () => void;
  onRefresh?: () => void | Promise<any>;
}

export const OfferGovernance: React.FC<OfferGovernanceProps> = ({
  role = "admin",
  scopedStoreId,
  scopedMerchantId,
  currentStore,
  offers: propOffers,
  merchants: propMerchants,
  stores: propStores,
  onAddOffer,
  onUpdateOfferStatus,
  onDeleteOffer,
  onCloneOffer,
  onOpenQR,
  onRefresh
}) => {
  const storeState = useAppStore();
  const effectiveRole = role || storeState.role || "admin";
  const stores = propStores || storeState.stores;
  const merchants = propMerchants || storeState.merchants;
  const rawOffers = propOffers && propOffers.length > 0 ? propOffers : storeState.offers;

  // Resolve current active store for branch label and GPS deep-linking
  const effectiveStore =
    currentStore ||
    stores.find((s) => s.id === scopedStoreId) ||
    storeState.stores.find((s) => s.id === scopedStoreId);

  const [filter, setFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState<"ALL" | "SERVICES" | "PRODUCTS" | "TABLES">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [cardSearch, setCardSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [cloningOffer, setCloningOffer] = useState<Offer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // Scoped offers according to persona
  const scopedOffers = rawOffers.filter((o) => {
    if (effectiveRole === "store" && (scopedStoreId || effectiveStore?.id)) {
      const targetStoreId = scopedStoreId || effectiveStore?.id;
      return !o.storeId || o.storeId === "all" || o.storeId === targetStoreId;
    }
    if (effectiveRole === "merchant" && (scopedMerchantId || storeState.currentUser?.merchantId)) {
      const targetMerchantId = scopedMerchantId || storeState.currentUser?.merchantId;
      return !o.merchantId || o.merchantId === targetMerchantId;
    }
    return true;
  });

  // Export CSV
  const handleExportOffersCsv = () => {
    const headers = [
      "ID",
      "Title",
      "Merchant Name",
      "Store Branch",
      "Discount Type",
      "Value",
      "Min Bill",
      "Max Discount",
      "Redemptions",
      "Valid To",
      "Status"
    ];
    const rows = scopedOffers.map((o) => [
      `"${o.id}"`,
      `"${(o.title || "").replace(/"/g, '""')}"`,
      `"${(o.merchantName || "").replace(/"/g, '""')}"`,
      `"${(o.storeName || "").replace(/"/g, '""')}"`,
      `"${o.type}"`,
      `"${o.value}"`,
      `"${o.minBillAmount}"`,
      `"${o.maxDiscount || ""}"`,
      `"${o.redemptions || 0}"`,
      `"${o.validTo || ""}"`,
      `"${o.status}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PINAK_Campaign_Offers_${effectiveRole}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${scopedOffers.length} campaign offers to CSV!`);
  };

  // Filtered displayed offers (status + domain)
  const displayedOffers = scopedOffers.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (domainFilter === "SERVICES" && o.scopeType === "PRODUCT") return false;
    if (domainFilter === "PRODUCTS" && o.scopeType !== "PRODUCT") return false;
    if (domainFilter === "TABLES" && !o.isTableBookingEnabled) return false;
    return true;
  });

  const formatExpiryDate = (validTo?: string) => {
    if (!validTo) return { text: "No Expiry", isExpired: false, sub: "Ongoing" };
    try {
      const d = new Date(validTo);
      if (isNaN(d.getTime())) return { text: validTo, isExpired: false, sub: "" };
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      if (diffDays < 0) {
        return { text: formatted, isExpired: true, sub: "Expired" };
      }
      if (diffDays === 0) {
        return { text: formatted, isExpired: false, sub: "Expires today" };
      }
      return { text: formatted, isExpired: false, sub: `${diffDays}d remaining` };
    } catch {
      return { text: validTo, isExpired: false, sub: "" };
    }
  };

  // Fallback status updater if not supplied
  const handleUpdateStatus = async (
    id: string,
    status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING_APPROVAL" | "PAUSED",
    reason?: string
  ) => {
    if (onUpdateOfferStatus) {
      await onUpdateOfferStatus(id, status, reason);
    } else {
      try {
        if (effectiveRole === "admin") {
          if (status === "ACTIVE") await offerApi.approveOfferAdmin(id);
          else if (status === "PAUSED") await offerApi.suspendOfferAdmin(id, reason);
          else if (status === "REJECTED") await offerApi.rejectOfferAdmin(id, reason);
        } else {
          await offerApi.toggleOfferStatus(id, status);
        }
        storeState.updateOfferStatus(id, status);
        toast.success(status === "PAUSED" ? "Campaign offer paused" : "Campaign offer resumed & active!");
        if (onRefresh) await onRefresh();
      } catch (err: any) {
        console.error("Status update error:", err);
        toast.error("Failed to update offer status");
      }
    }
  };

  // Fallback delete updater if not supplied
  const handleDelete = async (id: string) => {
    if (onDeleteOffer) {
      await onDeleteOffer(id);
    } else {
      try {
        await offerApi.deleteOffer(id);
        storeState.deleteOffer(id);
        toast.success("Offer deleted permanently");
        if (onRefresh) await onRefresh();
      } catch (err: any) {
        console.error("Delete offer error:", err);
        toast.error("Failed to delete offer");
      }
    }
  };

  const columns: Column<Offer>[] = [
    {
      header: "Campaign Deal",
      sortable: true,
      className: "min-w-0",
      accessor: "title",
      render: (o) => (
        <div className="flex items-center gap-2.5 py-1 min-w-0">
          {o.imageUrl ? (
            <img
              src={o.imageUrl}
              alt=""
              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs"
            />
          ) : (
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs",
              o.scopeType === "PRODUCT"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                : o.isTableBookingEnabled
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40"
                : "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/40"
            )}>
              {o.scopeType === "PRODUCT" ? (
                <ShoppingBag size={15} />
              ) : o.isTableBookingEnabled ? (
                <Armchair size={15} />
              ) : (
                <TicketPercent size={15} />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0",
                o.scopeType === "PRODUCT"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : o.isTableBookingEnabled
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
              )}>
                {o.scopeType === "PRODUCT" ? "Retail" : o.isTableBookingEnabled ? "Table" : "Service"}
              </span>
              {o.redemptionType && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0",
                  o.redemptionType === "WALK_IN"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40"
                    : o.redemptionType === "PRE_BOOK"
                    ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40"
                )}>
                  {o.redemptionType === "WALK_IN" ? "🚶 Walk-In" : o.redemptionType === "PRE_BOOK" ? `📅 Pre-Book (${o.minAdvanceHours || 2}h)` : "✨ Walk-In & Book"}
                </span>
              )}
              {o.isFlashDeal && (
                <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shrink-0 flex items-center gap-0.5">
                  <Zap size={8} /> Flash
                </span>
              )}
              <span className="font-bold text-slate-900 dark:text-white text-xs truncate" title={o.title}>
                {o.title}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
              <span className="truncate">
                {o.scopeType === "PRODUCT" && o.dealPrice
                  ? `Deal ₹${o.dealPrice} (MRP ₹${o.originalPrice || o.dealPrice})`
                  : `Min: ₹${o.minBillAmount || 0}`}
              </span>
              {o.bonusCoins ? (
                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  <Coins size={9} /> +{o.bonusCoins}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )
    },
    {
      header: effectiveRole === "store" ? "Store Outlet & Location" : "Merchant & Store",
      sortable: true,
      className: "w-52 lg:w-56 min-w-0",
      accessor: "merchantName",
      render: (o) => {
        const storeMatch = stores?.find((s) => s.id === o.storeId) || (o.storeId === effectiveStore?.id ? effectiveStore : undefined);
        const isChainWide = !o.storeId || o.storeId === "all";
        const branchLabel = storeMatch?.branchName || storeMatch?.storeName || o.storeName || (isChainWide ? "All Brand Outlets" : "Main Branch");
        const cityLabel = storeMatch?.city || (storeMatch?.address ? storeMatch.address.split(",").slice(-2)[0]?.trim() : null);

        return (
          <div className="min-w-0 py-1 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
              <Building2 size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate" title={o.merchantName}>{o.merchantName || "Partner Brand"}</span>
            </div>

            {isChainWide ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <StoreIcon size={10} />
                <span>All Brand Outlets</span>
              </span>
            ) : (
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <StoreIcon size={11} className="text-pink-500 shrink-0" />
                  <span className="truncate text-[11px] text-slate-700 dark:text-slate-300 font-semibold" title={`${branchLabel} • ${storeMatch?.address || ''}`}>
                    {branchLabel}
                  </span>
                  {cityLabel && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                      {cityLabel}
                    </span>
                  )}
                </div>
                {storeMatch?.latitude && storeMatch?.longitude && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    <MapPin size={9} className="text-pink-600 shrink-0" />
                    <span>{Number(storeMatch.latitude).toFixed(4)}, {Number(storeMatch.longitude).toFixed(4)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: "Benefit Structure & Value",
      sortable: true,
      className: "w-36 lg:w-48 min-w-0",
      accessor: "value",
      render: (o) => {
        const benefit = getOfferBenefitInfo(o);
        return (
          <div className="min-w-0 py-1 space-y-1">
            <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-xs font-black shadow-2xs", benefit.badgeClass)}>
              {benefit.iconName === "Tag" && <Tag size={11} className="shrink-0 text-pink-600" />}
              {benefit.iconName === "Coins" && <Coins size={11} className="shrink-0 text-emerald-600" />}
              {benefit.iconName === "Sparkles" && <Sparkles size={11} className="shrink-0 text-amber-500" />}
              {benefit.iconName === "Zap" && <Zap size={11} className="shrink-0 text-purple-600" />}
              <span className="whitespace-nowrap">{benefit.dealBadge}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300">{benefit.structureName}</span>
              <span>•</span>
              <span className="truncate">{benefit.capLabel}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: "Claims",
      sortable: true,
      className: "w-20 lg:w-24 whitespace-nowrap",
      accessor: "redemptions",
      render: (o) => {
        const used = o.redemptions || 0;
        const total = o.maxTotalRedemptions;
        const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
        return (
          <div className="min-w-0 py-1 space-y-0.5">
            <div className="text-xs font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
              {used.toLocaleString()}{total ? ` / ${total.toLocaleString()}` : ""}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {total ? `${pct}% claimed` : "unlimited"}
            </div>
          </div>
        );
      }
    },
    {
      header: "Valid Till",
      sortable: true,
      className: "w-28 lg:w-32 whitespace-nowrap",
      accessor: "validTo",
      render: (o) => {
        const { text, isExpired, sub } = formatExpiryDate(o.validTo);
        return (
          <div className="min-w-0 py-1 space-y-0.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              <Calendar size={11} className="text-slate-400 shrink-0" />
              <span>{text}</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold block truncate",
              isExpired
                ? "text-rose-500"
                : "text-emerald-600 dark:text-emerald-400"
            )}>
              {sub}
            </span>
          </div>
        );
      }
    },
    {
      header: "Status",
      sortable: true,
      className: "w-28 lg:w-32 whitespace-nowrap",
      accessor: "status",
      render: (o) => (
        <Badge
          className="whitespace-nowrap px-2 py-0.5 text-[10px] font-bold"
          variant={
            o.status === "ACTIVE"
              ? "success"
              : o.status === "REJECTED" || o.status === "EXPIRED"
              ? "destructive"
              : "warning"
          }
        >
          {o.status === "ACTIVE" ? (
            <CheckCircle2 size={11} />
          ) : o.status === "PENDING_APPROVAL" ? (
            <Clock size={11} />
          ) : (
            <XCircle size={11} />
          )}
          <span>
            {o.status === "PENDING_APPROVAL"
              ? "Pending"
              : o.status === "DEACTIVATED" || o.status === "PAUSED"
              ? "Paused"
              : o.status.replace("_", " ")}
          </span>
        </Badge>
      )
    },
    {
      header: "",
      sortable: false,
      className: "w-14 text-center px-1 shrink-0",
      render: (o) => (
        <div className="flex items-center justify-center py-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Actions"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50">
              <DropdownMenuItem
                onClick={() => setSelectedOffer(o)}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <Eye size={14} className="text-pink-600" />
                <span>Review Details</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setEditingOffer(o);
                  setIsAddOpen(true);
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600"
              >
                <Edit3 size={14} />
                <span>Edit Campaign</span>
              </DropdownMenuItem>

              {o.status === "ACTIVE" && (
                <DropdownMenuItem
                  onClick={() => {
                    handleUpdateStatus(o.id, "PAUSED");
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600"
                >
                  <Pause size={14} />
                  <span>Pause Campaign</span>
                </DropdownMenuItem>
              )}

              {(o.status === "PAUSED" || o.status === "DEACTIVATED") && (
                <DropdownMenuItem
                  onClick={() => {
                    handleUpdateStatus(o.id, "ACTIVE");
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600"
                >
                  <Play size={14} />
                  <span>Resume Campaign</span>
                </DropdownMenuItem>
              )}

              {o.status === "PENDING_APPROVAL" && effectiveRole === "admin" && (
                <DropdownMenuItem
                  onClick={() => {
                    handleUpdateStatus(o.id, "ACTIVE");
                    toast.success(`Offer "${o.title}" approved & activated!`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve & Activate</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  if (onCloneOffer) {
                    onCloneOffer(o.id);
                  } else {
                    setCloningOffer(o);
                    setIsAddOpen(true);
                  }
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"
              >
                <Copy size={14} />
                <span>Duplicate Campaign</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={() => setOfferToDelete(o)}
                className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold cursor-pointer rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
              >
                <Trash2 size={14} />
                <span>Delete Campaign</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  const filteredOffersForCards = displayedOffers.filter((o) => {
    if (!cardSearch.trim()) return true;
    const q = cardSearch.toLowerCase().trim();
    return (
      (o.title || "").toLowerCase().includes(q) ||
      (o.merchantName || "").toLowerCase().includes(q) ||
      (o.tagline || "").toLowerCase().includes(q) ||
      (o.badgeText || "").toLowerCase().includes(q) ||
      (o.terms || "").toLowerCase().includes(q)
    );
  });

  const headerTitle =
    effectiveRole === "store"
      ? "Store Deals & Offers"
      : effectiveRole === "merchant"
      ? "Merchant Offer Studio"
      : "Offers & Campaign Governance";

  const headerSubtitle =
    effectiveRole === "store"
      ? "Manage active discount campaigns, happy hours, table deals, and local discovery promotions for this branch."
      : effectiveRole === "merchant"
      ? "Create and govern promotional discount campaigns with fraud caps, store targeting, and happy hours."
      : "Review merchant discounts, enforce margin guardrails, and control mobile discovery campaign approvals.";

  const previewUrl =
    effectiveRole === "store" && effectiveStore?.latitude && effectiveStore?.longitude
      ? `/customer-preview?lat=${effectiveStore.latitude}&lng=${effectiveStore.longitude}&name=${encodeURIComponent(effectiveStore.branchName || effectiveStore.storeName || "Branch Outlet")}`
      : "/customer-preview";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              {headerTitle}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 flex items-center gap-1 shadow-2xs">
              <Sparkles size={12} />
              Live Deal Discovery
            </span>
            {effectiveRole === "store" && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1.5 shadow-2xs">
                <StoreIcon size={12} className="text-purple-600 dark:text-purple-400" />
                <span>{effectiveStore?.branchName || effectiveStore?.storeName || "This Store Outlet"}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {headerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Live Offers"
            >
              <RefreshCw size={14} />
            </button>
          )}

          {onOpenQR && (
            <button
              type="button"
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Open Counter Standee QR"
            >
              <QrCode size={14} className="text-pink-600" />
              <span>Standee QR</span>
            </button>
          )}

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shadow-2xs"
            title={effectiveRole === "store" ? "Preview customer mobile feed centered on this branch outlet" : "Preview customer mobile discovery feed"}
          >
            <Smartphone size={15} className="text-purple-600" />
            <span>Customer App Preview</span>
          </a>

          <button
            type="button"
            onClick={handleExportOffersCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            title="Export campaigns as CSV"
          >
            <Download size={14} />
            <span>Export (.CSV)</span>
          </button>

          <button
            onClick={() => {
              setEditingOffer(null);
              setCloningOffer(null);
              setIsAddOpen(true);
            }}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Campaign Offer</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Campaigns</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
              <TicketPercent size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {scopedOffers.length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {effectiveRole === "store" ? "Branch Deals & Promos" : "Catalog Deals & Promos"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deals</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {scopedOffers.filter((o) => o.status === "ACTIVE").length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Live on Mobile Discovery</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {scopedOffers.filter((o) => o.status === "PENDING_APPROVAL").length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Awaiting Margin Audit</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Claims</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {scopedOffers.reduce((acc, o) => acc + (o.redemptions || 0), 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Customer Redemptions</span>
          </div>
        </div>
      </div>

      {/* Filters & View Mode Switcher Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: "ALL", label: "All Campaigns" },
            { id: "ACTIVE", label: "Active" },
            { id: "PAUSED", label: "Paused" },
            { id: "PENDING_APPROVAL", label: "Pending Approval" },
            { id: "EXPIRED", label: "Expired" },
            { id: "REJECTED", label: "Rejected" },
          ].map(({ id: st, label }) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                filter === st
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Domain Filter + Table/Cards Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setDomainFilter("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer",
                domainFilter === "ALL"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setDomainFilter("SERVICES")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                domainFilter === "SERVICES"
                  ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Utensils size={11} />
              <span>Services</span>
            </button>
            <button
              type="button"
              onClick={() => setDomainFilter("PRODUCTS")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                domainFilter === "PRODUCTS"
                  ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <ShoppingBag size={11} />
              <span>Products</span>
            </button>
            <button
              type="button"
              onClick={() => setDomainFilter("TABLES")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1",
                domainFilter === "TABLES"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              )}
            >
              <Armchair size={11} />
              <span>Table Deals</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-300 shadow-xs font-bold"
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
                  ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-300 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
              title="Card Grid View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table View OR Cards View */}
      {viewMode === "table" ? (
        <AdvancedTable
          title={
            effectiveRole === "store"
              ? "Store Promotional Registry"
              : effectiveRole === "merchant"
              ? "Merchant Campaign Registry"
              : "Discounts & Offers Registry"
          }
          subtitle={
            effectiveRole === "store"
              ? `${displayedOffers.length} promotional campaign${displayedOffers.length === 1 ? "" : "s"} active for this branch`
              : effectiveRole === "merchant"
              ? `${displayedOffers.length} promotional campaign${displayedOffers.length === 1 ? "" : "s"} active across brand outlets`
              : `${displayedOffers.length} discount campaign${displayedOffers.length === 1 ? "" : "s"} active in platform catalog`
          }
          columns={columns}
          data={displayedOffers}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search campaigns, merchants, terms..."
          searchFilter={(o, q) =>
            Boolean(
              o.title.toLowerCase().includes(q) ||
              o.merchantName.toLowerCase().includes(q) ||
              (o.terms && o.terms.toLowerCase().includes(q))
            )
          }
          bulkActions={effectiveRole === "admin" ? [
            {
              label: "Approve Selected Deals",
              variant: "success",
              action: (selected) => {
                selected.forEach((o) => handleUpdateStatus(o.id, "ACTIVE"));
                toast.success(`Approved ${selected.length} campaigns for mobile discovery!`);
              }
            }
          ] : undefined}
        />
      ) : (
        /* Cards View */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search deals, products, merchants..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
              {cardSearch && (
                <button
                  type="button"
                  onClick={() => setCardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{filteredOffersForCards.length}</span> deals
            </span>
          </div>

          {filteredOffersForCards.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#121626] border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 mx-auto flex items-center justify-center">
                <TicketPercent size={24} />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No campaigns found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active campaigns match your selected status, category, or search filters.
              </p>
              {(filter !== "ALL" || domainFilter !== "ALL" || cardSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("ALL");
                    setDomainFilter("ALL");
                    setCardSearch("");
                  }}
                  className="text-xs font-bold text-pink-600 hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredOffersForCards.map((o) => {
                const discountPct =
                  o.originalPrice && o.dealPrice && o.originalPrice > o.dealPrice
                    ? Math.round(((o.originalPrice - o.dealPrice) / o.originalPrice) * 100)
                    : null;

                return (
                  <div
                    key={o.id}
                    className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-pink-300 dark:hover:border-pink-900 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Image Thumbnail if available */}
                      {o.imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden aspect-video w-full bg-slate-100 dark:bg-slate-800">
                          <img
                            src={o.imageUrl}
                            alt={o.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {o.isFlashDeal && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-red-600 text-white shadow-md flex items-center gap-1">
                              <Zap size={11} className="fill-white" />
                              <span>Flash Bargain</span>
                            </span>
                          )}
                          {o.promoCode && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-black/70 backdrop-blur-xs text-white">
                              Code: {o.promoCode}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Header Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider",
                              o.scopeType === "PRODUCT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            )}
                          >
                            {o.scopeType === "PRODUCT"
                              ? o.productCategory
                                ? `${o.productCategory} • Retail`
                                : "Retail Deal"
                              : "Service Offer"}
                          </span>
                          {o.badgeText && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                              {o.badgeText}
                            </span>
                          )}
                          {o.isTableBookingEnabled && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-0.5">
                              <Armchair size={10} /> Table Booking
                            </span>
                          )}
                        </div>

                        <Badge
                          variant={
                            o.status === "ACTIVE"
                              ? "success"
                              : o.status === "REJECTED" || o.status === "EXPIRED"
                              ? "destructive"
                              : "warning"
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {o.status === "ACTIVE" ? (
                            <CheckCircle2 size={11} />
                          ) : o.status === "PAUSED" ? (
                            <Pause size={11} />
                          ) : (
                            <Clock size={11} />
                          )}
                          <span>{o.status.replace("_", " ")}</span>
                        </Badge>
                      </div>

                      {/* Title & Merchant */}
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-pink-600 transition-colors">
                          {o.title}
                        </h4>
                        {o.tagline && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-0.5">
                            "{o.tagline}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs font-semibold mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 truncate">
                            <Building2 size={12} className="text-purple-500 shrink-0" />
                            <span className="truncate">{o.merchantName}</span>
                          </span>
                          {(() => {
                            const storeMatch = stores?.find((s) => s.id === o.storeId) || (o.storeId === effectiveStore?.id ? effectiveStore : undefined);
                            const isChainWide = !o.storeId || o.storeId === "all";
                            const label = isChainWide ? "All Outlets" : (storeMatch?.city ? `${storeMatch.city} Branch` : (o.storeName || "Branch"));
                            return (
                              <span className="flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-400 font-bold shrink-0">
                                <StoreIcon size={11} className="shrink-0" />
                                <span>{label}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Pricing Highlight */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        {o.scopeType === "PRODUCT" && (o.dealPrice || o.originalPrice) ? (
                          <div className="flex items-baseline justify-between">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                ₹{o.dealPrice || o.value}
                              </span>
                              {o.originalPrice && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{o.originalPrice}
                                </span>
                              )}
                            </div>
                            {discountPct && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {discountPct}% OFF
                              </span>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const benefit = getOfferBenefitInfo(o);
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border", benefit.badgeClass)}>
                                    {benefit.structureName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                    {benefit.capLabel}
                                  </span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                  <span className="text-lg font-extrabold text-pink-600 dark:text-pink-400 font-mono">
                                    {benefit.dealBadge}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
                          <span>Min Spend: ₹{o.minBillAmount}</span>
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <Coins size={11} />
                            <span>+{o.bonusCoins || 100} Coins</span>
                          </span>
                        </div>
                      </div>

                      {/* Scope & Redemption Stats */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {o.applicableStoreIds?.length
                            ? `${o.applicableStoreIds.length} Linked Branches`
                            : "All Merchant Branches"}
                        </span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {o.redemptions || 0} claims
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingOffer(o);
                            setIsAddOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Pause / Resume */}
                        {o.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus(o.id, "PAUSED");
                            }}
                            className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="Pause Campaign"
                          >
                            <Pause size={14} />
                          </button>
                        )}
                        {o.status === "PAUSED" && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateStatus(o.id, "ACTIVE");
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Resume Campaign"
                          >
                            <Play size={14} />
                          </button>
                        )}

                        {/* Clone */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onCloneOffer) {
                              onCloneOffer(o.id);
                            } else {
                              setCloningOffer(o);
                              setIsAddOpen(true);
                            }
                          }}
                          className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                          title="Duplicate Campaign"
                        >
                          <Copy size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setOfferToDelete(o)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedOffer(o)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Offer Details & Audit History Drawer */}
      {selectedOffer && (
        <OfferDetailsDrawer
          offer={selectedOffer}
          stores={stores}
          onClose={() => setSelectedOffer(null)}
          isAdmin={effectiveRole === "admin"}
          onUpdateStatus={(status, reason) => {
            handleUpdateStatus(selectedOffer.id, status as any, reason);
            setSelectedOffer(null);
          }}
        />
      )}

      {/* Create / Edit Campaign Drawer */}
      {isAddOpen && (
        <OfferCampaignFormDrawer
          onClose={() => {
            setIsAddOpen(false);
            setEditingOffer(null);
            setCloningOffer(null);
          }}
          merchants={merchants}
          stores={stores}
          role={effectiveRole}
          scopedStoreId={scopedStoreId || effectiveStore?.id}
          scopedMerchantId={scopedMerchantId || effectiveStore?.merchantId}
          initialData={editingOffer || cloningOffer ? (editingOffer || cloningOffer) : undefined}
          isEdit={Boolean(editingOffer)}
          onSave={async (draft) => {
            if (editingOffer) {
              try {
                await offerApi.updateOffer(editingOffer.id, {
                  ...draft,
                  storeId: (draft.storeId && draft.storeId !== "all") ? draft.storeId : (scopedStoreId || effectiveStore?.id),
                } as any);
                toast.success(`Offer "${draft.title}" updated!`);
                if (onRefresh) await onRefresh();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || "Failed to update offer");
              }
            } else if (onAddOffer) {
              await onAddOffer(draft);
            }
            setIsAddOpen(false);
            setEditingOffer(null);
            setCloningOffer(null);
          }}
        />
      )}

      {/* Delete Offer Confirmation Modal */}
      {offerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Campaign Offer</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{offerToDelete.title}</p>
              <p className="text-slate-500">Merchant: {offerToDelete.merchantName}</p>
              <p className="text-slate-400 text-[11px]">
                {offerToDelete.type === "FLAT_PCT" ? `${offerToDelete.value}% OFF` : `₹${offerToDelete.value} FLAT OFF`} • {offerToDelete.redemptions || 0} claims
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {effectiveRole === "store"
                ? "Permanently deleting this campaign will remove it from this branch's customer listings and mobile discovery feeds."
                : effectiveRole === "merchant"
                ? "Permanently deleting this campaign will remove it from all merchant listings and mobile discovery feeds."
                : "Permanently deleting this campaign will remove it from catalog listings and mobile discovery feeds."}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfferToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete(offerToDelete.id);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
