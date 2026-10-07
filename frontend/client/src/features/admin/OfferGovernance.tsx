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
  Sparkles
} from "lucide-react";
import { Offer, Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { offerCampaignSchema } from "../../lib/validationSchemas";

interface OfferGovernanceProps {
  offers: Offer[];
  merchants: Merchant[];
  onAddOffer: (draft: Partial<Offer>) => void;
  onUpdateOfferStatus: (id: string, status: "ACTIVE" | "REJECTED" | "EXPIRED" | "PENDING_APPROVAL" | "PAUSED") => void;
  onDeleteOffer?: (id: string) => void;
  onCloneOffer?: (id: string) => void;
}

export const OfferGovernance: React.FC<OfferGovernanceProps> = ({
  offers,
  merchants,
  onAddOffer,
  onUpdateOfferStatus,
  onDeleteOffer,
  onCloneOffer
}) => {
  const [filter, setFilter] = useState("ALL");
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

  const displayedOffers = filter === "ALL"
    ? offers
    : offers.filter((o) => o.status === filter);

  const columns: Column<Offer>[] = [
    {
      header: "Campaign Offer",
      sortable: true,
      accessor: "title",
      render: (o) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 flex items-center justify-center shrink-0">
            <TicketPercent size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{o.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Min bill: ₹{o.minBillAmount}</p>
          </div>
        </div>
      )
    },
    {
      header: "Merchant Brand",
      sortable: true,
      accessor: "merchantName",
      render: (o) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
          <Building2 size={13} className="text-purple-500" />
          <span>{o.merchantName}</span>
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

      {/* Filter Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
        {["ALL", "ACTIVE", "PAUSED", "PENDING_APPROVAL", "EXPIRED", "REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              filter === st
                ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold"
                : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {st === "ALL" ? "All Campaigns" : st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Advanced Table */}
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

      {/* Offer Review Right Slide-Over Drawer */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOffer(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 flex items-center justify-center font-bold text-sm shadow-xs">
                    <TicketPercent size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Campaign Offer Review
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">ID: {selectedOffer.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedOffer.status === "ACTIVE"
                        ? "success"
                        : selectedOffer.status === "REJECTED" || selectedOffer.status === "EXPIRED"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {selectedOffer.status === "ACTIVE" ? (
                      <CheckCircle2 size={12} />
                    ) : selectedOffer.status === "PENDING_APPROVAL" ? (
                      <Clock size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {selectedOffer.status.replace("_", " ")}
                  </Badge>
                  <button
                    onClick={() => setSelectedOffer(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Title & Brand Card */}
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                    Promotional Campaign
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {selectedOffer.title}
                  </h4>
                  <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Merchant Brand:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Building2 size={12} />
                      {selectedOffer.merchantName}
                    </span>
                  </div>
                </div>

                {/* Economics / Discount Rules */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                    Discount Structure & Spend Threshold
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Discount Value</p>
                      <p className="text-base font-extrabold text-pink-600 dark:text-pink-400 mt-0.5 font-mono">
                        {selectedOffer.type === "FLAT_AMT"
                          ? `₹${selectedOffer.value} Off`
                          : selectedOffer.type === "FLAT_PCT"
                          ? `${selectedOffer.value}% Off`
                          : "Buy 1 Get 1"}
                      </p>
                      {selectedOffer.maxDiscount && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Maximum Cap: ₹{selectedOffer.maxDiscount}</p>
                      )}
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Minimum Spend</p>
                      <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                        ₹{selectedOffer.minBillAmount}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Minimum cart threshold</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-1.5">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Terms & Conditions</h5>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                    {selectedOffer.terms || "Standard merchant terms apply to all redemptions."}
                  </p>
                </div>

                {/* Campaign Analytics & Schedule */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Live Customer Claims:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {selectedOffer.redemptions.toLocaleString()} claimed
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Valid Until:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {selectedOffer.validTo}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <span className="text-slate-500">Discovery Engine:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Eligible for Mobile Discovery
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => {
                    onUpdateOfferStatus(selectedOffer.id, "REJECTED");
                    setSelectedOffer(null);
                    toast.info(`Offer campaign marked as Rejected`);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                >
                  Reject Deal
                </button>
                <button
                  onClick={() => {
                    onUpdateOfferStatus(selectedOffer.id, "PENDING_APPROVAL");
                    setSelectedOffer(null);
                    toast.info(`Offer campaign set to Pending Review`);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => {
                    onUpdateOfferStatus(selectedOffer.id, "ACTIVE");
                    setSelectedOffer(null);
                    toast.success(`Offer approved & published to mobile discovery!`);
                  }}
                  className="btn-gradient px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md"
                >
                  Approve for Discovery
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Create Offer Drawer */}
      {isAddOpen && (
        <CreateOfferDrawer
          merchants={merchants}
          onClose={() => setIsAddOpen(false)}
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

function CreateOfferDrawer({
  merchants,
  onClose,
  onSave
}: {
  merchants: Merchant[];
  onClose: () => void;
  onSave: (draft: any) => void;
}) {
  const [merchantId, setMerchantId] = useState(merchants[0]?.id || "m-1");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO">("FLAT_AMT");
  const [value, setValue] = useState(200);
  const [minBillAmount, setMinBillAmount] = useState(1000);
  const [maxDiscount, setMaxDiscount] = useState(500);
  const [validTo, setValidTo] = useState("2026-10-31");
  const [terms, setTerms] = useState("Valid on all dine-in bills exceeding threshold.");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedMerchant = merchants.find(m => m.id === merchantId);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const result = offerCampaignSchema.safeParse({
      title: title.trim(),
      type,
      value: Number(value),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minBillAmount: Number(minBillAmount),
      validTo: validTo.trim(),
      terms: terms.trim(),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0]?.message || "Please fix validation errors");
      return;
    }

    setErrors({});
    onSave({
      merchantId,
      merchantName: selectedMerchant?.businessName || "Merchant",
      title: title.trim(),
      type,
      value: Number(value),
      minBillAmount: Number(minBillAmount),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      validTo: validTo.trim(),
      terms: terms.trim(),
      status: "ACTIVE"
    });
    toast.success(`Platform offer "${title}" published!`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Campaign Offer
              </h3>
              <p className="text-[11px] text-slate-400">Configure discount rules, spend limits, and validity</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
          </div>

          <form onSubmit={handlePublish} noValidate className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Merchant *</label>
              <select
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              >
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.businessName} ({m.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Campaign Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  clearError("title");
                }}
                placeholder="e.g. Weekend Special Fest"
                className={cn(
                  "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                  errors.title ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
              />
              {errors.title && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.title}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Discount Type *</label>
                <select
                  value={type}
                  onChange={e => {
                    setType(e.target.value as any);
                    clearError("type");
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="FLAT_AMT">Flat Amount (₹)</option>
                  <option value="FLAT_PCT">Percentage (%)</option>
                  <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {type === "FLAT_AMT" ? "Flat Value (₹) *" : type === "FLAT_PCT" ? "Percentage (%) *" : "Qty *"}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={e => {
                    setValue(parseFloat(e.target.value) || 0);
                    clearError("value");
                  }}
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden",
                    errors.value ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                  )}
                />
                {errors.value && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.value}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Min Bill Amount (₹) *</label>
                <input
                  type="number"
                  value={minBillAmount}
                  onChange={e => {
                    setMinBillAmount(parseFloat(e.target.value) || 0);
                    clearError("minBillAmount");
                  }}
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                    errors.minBillAmount ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                  )}
                />
                {errors.minBillAmount && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.minBillAmount}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Valid Until *</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={e => {
                    setValidTo(e.target.value);
                    clearError("validTo");
                  }}
                  className={cn(
                    "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                    errors.validTo ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                  )}
                />
                {errors.validTo && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="shrink-0" />
                    <span>{errors.validTo}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={e => {
                  setTerms(e.target.value);
                  clearError("terms");
                }}
                className={cn(
                  "mt-1 w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden",
                  errors.terms ? "border-rose-500 ring-1 ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                )}
                rows={3}
              />
              {errors.terms && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{errors.terms}</span>
                </p>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
              <button
                type="submit"
                className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
              >
                Publish Campaign
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
