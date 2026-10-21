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
  Store as StoreIcon
} from "lucide-react";
import { Offer, Merchant, Store } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useAppStore } from "../../hooks/useAppStore";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { OfferDetailsDrawer } from "../../components/OfferDetailsDrawer";

interface OfferGovernanceProps {
  offers: Offer[];
  merchants: Merchant[];
  stores?: Store[];
  onAddOffer: (draft: Partial<Offer>) => void;
  onUpdateOfferStatus: (id: string, status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING_APPROVAL" | "PAUSED", reason?: string) => void;
  onDeleteOffer?: (id: string) => void;
  onCloneOffer?: (id: string) => void;
}

export const OfferGovernance: React.FC<OfferGovernanceProps> = ({
  offers,
  merchants,
  stores: propStores,
  onAddOffer,
  onUpdateOfferStatus,
  onDeleteOffer,
  onCloneOffer
}) => {
  const storeState = useAppStore();
  const stores = propStores || storeState.stores;
  const [filter, setFilter] = useState("ALL");
  const [domainFilter, setDomainFilter] = useState<"ALL" | "SERVICES" | "PRODUCTS" | "TABLES">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [cardSearch, setCardSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  const handleExportOffersCsv = () => {
    const headers = [
      "ID",
      "Title",
      "Merchant Name",
      "Discount Type",
      "Value",
      "Min Bill",
      "Max Discount",
      "Redemptions",
      "Valid To",
      "Status"
    ];
    const rows = offers.map((o) => [
      `"${o.id}"`,
      `"${(o.title || "").replace(/"/g, '""')}"`,
      `"${(o.merchantName || "").replace(/"/g, '""')}"`,
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
      `PINAK_Campaign_Offers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${offers.length} campaign offers to CSV!`);
  };

  const displayedOffers = offers.filter((o) => {
    if (filter !== "ALL" && o.status !== filter) return false;
    if (domainFilter === "SERVICES" && o.scopeType === "PRODUCT") return false;
    if (domainFilter === "PRODUCTS" && o.scopeType !== "PRODUCT") return false;
    if (domainFilter === "TABLES" && !o.isTableBookingEnabled) return false;
    return true;
  });

  const columns: Column<Offer>[] = [
    {
      header: "Campaign Offer",
      sortable: true,
      accessor: "title",
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            o.scopeType === "PRODUCT"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300"
          )}>
            {o.scopeType === "PRODUCT" ? <ShoppingBag size={18} /> : <TicketPercent size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase",
                o.scopeType === "PRODUCT"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
              )}>
                {o.scopeType === "PRODUCT" ? "Retail Deal" : "Service Offer"}
              </span>
              {o.isFlashDeal && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center gap-0.5">
                  <Zap size={9} /> Flash
                </span>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight mt-0.5">{o.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {o.scopeType === "PRODUCT" && o.dealPrice
                ? `Deal: ₹${o.dealPrice} (MRP ₹${o.originalPrice || o.dealPrice})`
                : `Min bill: ₹${o.minBillAmount}`}
              {o.bonusCoins ? ` • +${o.bonusCoins} Coins` : ""}
            </p>
          </div>
        </div>
      )
    },
    {
      header: "Merchant & Store",
      sortable: true,
      accessor: "merchantName",
      render: (o) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Building2 size={13} className="text-purple-500 shrink-0" />
            <span className="truncate">{o.merchantName}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <StoreIcon size={11} className="text-pink-500 shrink-0" />
            <span className="truncate">{o.storeName || (o.storeId === "all" ? "All Outlets" : "Branch Store")}</span>
          </div>
        </div>
      )
    },
    {
      header: "Discount Rule",
      sortable: true,
      accessor: "value",
      render: (o) => (
        <div>
          <span className="font-bold text-pink-600 dark:text-pink-400 font-mono">
            {o.type === "FLAT_AMT"
              ? `Flat ₹${o.value} Off`
              : o.type === "FLAT_PCT"
              ? `${o.value}% Off`
              : "Buy 1 Get 1"}
          </span>
          {o.maxDiscount && (
            <span className="text-[11px] text-slate-400 block">cap ₹{o.maxDiscount}</span>
          )}
        </div>
      )
    },
    {
      header: "Redemptions",
      sortable: true,
      accessor: "redemptions",
      render: (o) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          {o.redemptions.toLocaleString()}
        </span>
      )
    },
    {
      header: "Expiry Date",
      sortable: true,
      accessor: "validTo",
      render: (o) => <span className="font-mono text-xs text-slate-500">{o.validTo}</span>
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (o) => (
        <Badge
          variant={
            o.status === "ACTIVE"
              ? "success"
              : o.status === "REJECTED" || o.status === "EXPIRED"
              ? "destructive"
              : "warning"
          }
        >
          {o.status === "ACTIVE" ? (
            <CheckCircle2 size={12} />
          ) : o.status === "PENDING_APPROVAL" ? (
            <Clock size={12} />
          ) : (
            <XCircle size={12} />
          )}
          {o.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Pause / Resume toggle */}
          {o.status === "ACTIVE" && (
            <button
              onClick={() => {
                onUpdateOfferStatus(o.id, "PAUSED");
                toast.info(`Offer "${o.title}" paused`);
              }}
              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Pause Campaign"
            >
              <Pause size={14} />
            </button>
          )}
          {o.status === "PAUSED" && (
            <button
              onClick={() => {
                onUpdateOfferStatus(o.id, "ACTIVE");
                toast.success(`Offer "${o.title}" resumed`);
              }}
              className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Resume Campaign"
            >
              <Play size={14} />
            </button>
          )}

          {/* 1-Click Duplicate/Clone */}
          {onCloneOffer && (
            <button
              onClick={() => {
                onCloneOffer(o.id);
                toast.success(`Campaign "${o.title}" duplicated as draft`);
              }}
              className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
              title="Duplicate Campaign"
            >
              <Copy size={14} />
            </button>
          )}

          {/* Review Details */}
          <button
            onClick={() => setSelectedOffer(o)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors shadow-2xs"
            title="Review Campaign Details"
          >
            <Eye size={13} />
            <span>Review</span>
          </button>

          {/* Delete Action */}
          {onDeleteOffer && (
            <button
              onClick={() => setOfferToDelete(o)}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete Campaign"
            >
              <Trash2 size={14} />
            </button>
          )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Offers & Campaign Governance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 flex items-center gap-1">
              <Sparkles size={12} />
              Live Deal Discovery
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review merchant discounts, enforce margin guardrails, and control mobile discovery campaign approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportOffersCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
            title="Export campaigns as CSV"
          >
            <Download size={14} />
            <span>Export (.CSV)</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
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
              {offers.length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Catalog Deals & Promos</span>
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
              {offers.filter((o) => o.status === "ACTIVE").length}
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
              {offers.filter((o) => o.status === "PENDING_APPROVAL").length}
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
              {offers.reduce((acc, o) => acc + (o.redemptions || 0), 0).toLocaleString()}
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
          {["ALL", "ACTIVE", "PAUSED", "PENDING_APPROVAL", "EXPIRED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                filter === st
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold shadow-2xs"
                  : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {st === "ALL" ? "All Campaigns" : st.replace("_", " ")}
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
          title="Discounts & Offers Registry"
          subtitle={`${displayedOffers.length} discount campaigns active in catalog`}
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
          bulkActions={[
            {
              label: "Approve Selected Deals",
              variant: "success",
              action: (selected) => {
                selected.forEach((o) => onUpdateOfferStatus(o.id, "ACTIVE"));
                toast.success(`Approved ${selected.length} campaigns for mobile discovery!`);
              }
            }
          ]}
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
                          <span className="flex items-center gap-1 text-[11px] text-pink-600 dark:text-pink-400 font-bold shrink-0">
                            <StoreIcon size={11} className="shrink-0" />
                            <span>{o.storeName || (o.storeId === "all" ? "All Outlets" : "Branch")}</span>
                          </span>
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
                          <div className="flex items-baseline justify-between">
                            <span className="text-lg font-extrabold text-pink-600 dark:text-pink-400 font-mono">
                              {o.type === "FLAT_AMT"
                                ? `Flat ₹${o.value} OFF`
                                : o.type === "FLAT_PCT"
                                ? `${o.value}% OFF`
                                : "Buy 1 Get 1"}
                            </span>
                            {o.maxDiscount && (
                              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                                Cap: ₹{o.maxDiscount}
                              </span>
                            )}
                          </div>
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
                        {/* Pause / Resume */}
                        {o.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateOfferStatus(o.id, "PAUSED");
                              toast.info(`Offer "${o.title}" paused`);
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
                              onUpdateOfferStatus(o.id, "ACTIVE");
                              toast.success(`Offer "${o.title}" resumed`);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            title="Resume Campaign"
                          >
                            <Play size={14} />
                          </button>
                        )}

                        {/* Clone */}
                        {onCloneOffer && (
                          <button
                            type="button"
                            onClick={() => {
                              onCloneOffer(o.id);
                              toast.success(`Campaign "${o.title}" duplicated`);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                            title="Duplicate Campaign"
                          >
                            <Copy size={14} />
                          </button>
                        )}

                        {/* Delete */}
                        {onDeleteOffer && (
                          <button
                            type="button"
                            onClick={() => setOfferToDelete(o)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
          onClose={() => setSelectedOffer(null)}
          isAdmin={true}
          onUpdateStatus={(status, reason) => {
            onUpdateOfferStatus(selectedOffer.id, status as any, reason);
            setSelectedOffer(null);
          }}
        />
      )}

      {/* Create / Edit Campaign Drawer */}
      {isAddOpen && (
        <OfferCampaignFormDrawer
          onClose={() => setIsAddOpen(false)}
          merchants={merchants}
          stores={stores}
          onSave={(draft) => {
            onAddOffer(draft);
            setIsAddOpen(false);
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
              Permanently deleting this campaign will remove it from all merchant listings and mobile discovery feeds.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOfferToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOffer) {
                    onDeleteOffer(offerToDelete.id);
                  }
                  toast.success(`Campaign "${offerToDelete.title}" deleted`);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
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
