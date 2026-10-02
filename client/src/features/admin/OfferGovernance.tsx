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
  Sparkles,
  Layers,
  AlertTriangle,
  Ban,
  RotateCcw,
  Loader2,
  Check,
  Tag,
  DollarSign,
  BarChart3
} from "lucide-react";
import { Offer, Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";
import { useAdminOffers } from "../../hooks/queries/useAdminOffers";

interface OfferGovernanceProps {
  offers?: Offer[];
  merchants?: Merchant[];
  onAddOffer?: (draft: Partial<Offer>) => void;
  onUpdateOfferStatus?: (id: string, status: "ACTIVE" | "REJECTED" | "EXPIRED") => void;
}

export const OfferGovernance: React.FC<OfferGovernanceProps> = ({
  offers: propOffers = [],
  merchants: propMerchants = [],
  onAddOffer: propOnAddOffer,
  onUpdateOfferStatus: propOnUpdateOfferStatus
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Reason Modal state
  const [actionModal, setActionModal] = useState<{
    type: "REJECT" | "SUSPEND" | null;
    offerId: string;
    offerTitle: string;
  }>({ type: null, offerId: "", offerTitle: "" });
  const [reasonInput, setReasonInput] = useState("");

  // React Query Admin Offers Hook
  const {
    offers: apiOffers,
    isLoading,
    isFetching,
    filters,
    setFilters,
    approveOffer,
    isApproving,
    rejectOffer,
    isRejecting,
    suspendOffer,
    isSuspending,
    createOffer
  } = useAdminOffers({
    status: statusFilter !== "ALL" && statusFilter !== "PENDING_APPROVAL" ? statusFilter : undefined,
    approvalStatus: statusFilter === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : undefined,
    offerType: typeFilter !== "ALL" ? typeFilter : undefined
  });

  const rawList = apiOffers.length > 0 ? apiOffers : propOffers;

  // Uniform mapping for table representation
  const displayedOffers = rawList.map((o: any) => ({
    id: o.id,
    merchantId: o.merchantId || "m-1",
    merchantName: o.merchantName || "Merchant Brand",
    title: o.title || o.name || "Campaign Offer",
    type: o.type || o.offerType || "FLAT_AMT",
    value: typeof o.value === "number" ? o.value : parseFloat(o.value) || 0,
    minBillAmount: typeof o.minBillAmount === "number" ? o.minBillAmount : parseFloat(o.minBillAmount) || 0,
    maxDiscount: typeof o.maxDiscount === "number" ? o.maxDiscount : (o.maxDiscount ? parseFloat(o.maxDiscount) : undefined),
    redemptions: o.redemptions || o.redemptionCount || 0,
    validTo: o.validTo ? (typeof o.validTo === "string" ? o.validTo.split("T")[0] : o.validTo) : "2026-12-31",
    validFrom: o.validFrom ? (typeof o.validFrom === "string" ? o.validFrom.split("T")[0] : o.validFrom) : "2026-01-01",
    status: o.status || "ACTIVE",
    approvalStatus: o.approvalStatus || (o.status === "ACTIVE" ? "APPROVED" : "PENDING_APPROVAL"),
    terms: o.terms || o.termsAndConditions || "Standard platform terms apply.",
    rejectionReason: o.rejectionReason
  }));

  const handleApprove = async (id: string) => {
    try {
      if (propOnUpdateOfferStatus) {
        propOnUpdateOfferStatus(id, "ACTIVE");
      }
      await approveOffer(id);
    } catch (e) {
      // Handled by query onError
    }
  };

  const handleActionModalSubmit = async () => {
    if (!reasonInput.trim()) {
      toast.error("Please enter a mandatory audit reason");
      return;
    }

    try {
      if (actionModal.type === "REJECT") {
        await rejectOffer({ offerId: actionModal.offerId, reason: reasonInput.trim() });
      } else if (actionModal.type === "SUSPEND") {
        await suspendOffer({ offerId: actionModal.offerId, reason: reasonInput.trim() });
      }
      setActionModal({ type: null, offerId: "", offerTitle: "" });
      setReasonInput("");
      if (selectedOffer?.id === actionModal.offerId) {
        setSelectedOffer(null);
      }
    } catch (e) {
      // Handled by query onError
    }
  };

  const columns: Column<any>[] = [
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
              : o.type === "CASHBACK"
              ? `₹${o.value} Cashback`
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
      header: "Valid Period",
      sortable: true,
      accessor: "validTo",
      render: (o) => (
        <span className="font-mono text-xs text-slate-500">
          {o.validFrom} – {o.validTo}
        </span>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (o) => {
        if (o.status === "ACTIVE") {
          return (
            <span className="badge-status badge-approved">
              <CheckCircle2 size={12} /> Active
            </span>
          );
        } else if (o.status === "SUSPENDED" || o.status === "DEACTIVATED") {
          return (
            <span className="badge-status bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">
              <Ban size={12} /> Suspended
            </span>
          );
        } else if (o.approvalStatus === "REJECTED" || o.status === "REJECTED") {
          return (
            <span className="badge-status badge-rejected">
              <XCircle size={12} /> Rejected
            </span>
          );
        } else {
          return (
            <span className="badge-status badge-pending">
              <Clock size={12} /> Pending Approval
            </span>
          );
        }
      }
    },
    {
      header: "Actions",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          {o.status !== "ACTIVE" && o.status !== "SUSPENDED" && (
            <>
              <button
                onClick={() => handleApprove(o.id)}
                disabled={isApproving}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors shadow-2xs inline-flex items-center gap-1"
              >
                <Check size={12} />
                Approve
              </button>
              <button
                onClick={() => setActionModal({ type: "REJECT", offerId: o.id, offerTitle: o.title })}
                disabled={isRejecting}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 transition-colors shadow-2xs inline-flex items-center gap-1"
              >
                <X size={12} />
                Reject
              </button>
            </>
          )}

          {o.status === "ACTIVE" && (
            <button
              onClick={() => setActionModal({ type: "SUSPEND", offerId: o.id, offerTitle: o.title })}
              disabled={isSuspending}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition-colors shadow-2xs inline-flex items-center gap-1"
            >
              <Ban size={12} />
              Suspend
            </button>
          )}

          <button
            onClick={() => setSelectedOffer(o)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors shadow-2xs"
          >
            <Eye size={13} />
            <span>Review</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Offers & Campaign Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review merchant discounts, enforce margin guardrails, and control mobile discovery campaign approvals.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Platform Offer</span>
        </button>
      </div>

      {/* Filter Toolbar: Status & Offer Type */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: "ALL", label: "All Campaigns" },
            { id: "ACTIVE", label: "Active" },
            { id: "PENDING_APPROVAL", label: "Pending Approval" },
            { id: "SUSPENDED", label: "Suspended" },
            { id: "EXPIRED", label: "Expired" },
            { id: "REJECTED", label: "Rejected" }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id);
                setFilters({
                  ...filters,
                  approvalStatus: st.id === "PENDING_APPROVAL" ? "PENDING_APPROVAL" : undefined,
                  status: st.id !== "ALL" && st.id !== "PENDING_APPROVAL" ? st.id : undefined
                });
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                statusFilter === st.id
                  ? "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800 font-bold"
                  : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Offer Type Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Type:</span>
          {[
            { id: "ALL", label: "All Types" },
            { id: "FLAT_AMT", label: "Flat ₹ Off" },
            { id: "FLAT_PCT", label: "Percentage %" },
            { id: "CASHBACK", label: "Cashback" },
            { id: "BOGO", label: "BOGO" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTypeFilter(t.id);
                setFilters({ ...filters, offerType: t.id !== "ALL" ? t.id : undefined });
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                typeFilter === t.id
                  ? "bg-purple-600 text-white font-bold"
                  : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-xs font-medium text-pink-600 dark:text-pink-400 px-1 animate-pulse">
          <Loader2 size={14} className="animate-spin" />
          <span>Syncing campaign offers database from Spring Boot AdminOfferController...</span>
        </div>
      )}

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
              selected.forEach((o) => handleApprove(o.id));
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
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <TicketPercent size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Offer Approval Review
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-2">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                    Offer Title
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedOffer.title}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Offered by:{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedOffer.merchantName}
                    </span>
                  </p>
                </div>

                {/* Campaign Economics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Discount Value</p>
                    <p className="text-base font-extrabold text-pink-600 dark:text-pink-400 mt-0.5 font-mono">
                      {selectedOffer.type === "FLAT_AMT"
                        ? `₹${selectedOffer.value} Off`
                        : selectedOffer.type === "FLAT_PCT"
                        ? `${selectedOffer.value}% Off`
                        : selectedOffer.type === "CASHBACK"
                        ? `₹${selectedOffer.value} Cashback`
                        : "BOGO"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Min Spend</p>
                    <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      ₹{selectedOffer.minBillAmount}
                    </p>
                  </div>
                </div>

                {/* Take-Rate & Max Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Max Discount Cap</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                      {selectedOffer.maxDiscount ? `₹${selectedOffer.maxDiscount}` : "No Limit"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Redemption Count</p>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                      {selectedOffer.redemptions.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/20 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200">Terms & Conditions</h5>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedOffer.terms || "Standard merchant terms apply."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valid Date Range:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{selectedOffer.validFrom} – {selectedOffer.validTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Internal Campaign ID:</span>
                    <span className="font-mono text-slate-400">{selectedOffer.id}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setActionModal({ type: "REJECT", offerId: selectedOffer.id, offerTitle: selectedOffer.title });
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                >
                  Reject Deal
                </button>
                {selectedOffer.status === "ACTIVE" ? (
                  <button
                    onClick={() => {
                      setActionModal({ type: "SUSPEND", offerId: selectedOffer.id, offerTitle: selectedOffer.title });
                    }}
                    className="px-3 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl"
                  >
                    Suspend Campaign
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleApprove(selectedOffer.id);
                      setSelectedOffer(null);
                    }}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
                  >
                    Approve for Discovery
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Create Offer Drawer */}
      {isAddOpen && (
        <CreateOfferDrawer
          merchants={propMerchants}
          onClose={() => setIsAddOpen(false)}
          onSave={async (draft) => {
            if (propOnAddOffer) {
              propOnAddOffer(draft);
            }
            try {
              await createOffer({
                merchantId: draft.merchantId,
                title: draft.title,
                type: draft.type,
                value: draft.value,
                minBillAmount: draft.minBillAmount,
                maxDiscount: draft.maxDiscount,
                validFrom: draft.validFrom || "2026-10-01",
                validTo: draft.validTo,
                termsAndConditions: draft.terms
              });
            } catch (e) {
              // Handled by query onError
            }
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Audit Reason Modal (Reject / Suspend) */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#121626] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  actionModal.type === "REJECT"
                    ? "bg-red-100 dark:bg-red-950/60 text-red-600"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-600"
                }`}
              >
                {actionModal.type === "REJECT" ? <AlertTriangle size={20} /> : <Ban size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {actionModal.type === "REJECT" ? "Reject Offer Campaign" : "Suspend Offer Campaign"}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <span className="font-bold text-slate-800 dark:text-slate-200">{actionModal.offerTitle}</span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Audit Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder={
                  actionModal.type === "REJECT"
                    ? "Enter reason for rejection (e.g. Unrealistic discount margin or violation of merchant terms)..."
                    : "Enter reason for suspension (e.g. Fraudulent redemptions detected or budget cap reached)..."
                }
                rows={3}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActionModal({ type: null, offerId: "", offerTitle: "" });
                  setReasonInput("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionModalSubmit}
                disabled={isRejecting || isSuspending}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 ${
                  actionModal.type === "REJECT" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {(isRejecting || isSuspending) && <Loader2 size={13} className="animate-spin" />}
                <span>{actionModal.type === "REJECT" ? "Confirm Rejection" : "Confirm Suspension"}</span>
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
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO" | "CASHBACK">("FLAT_AMT");
  const [value, setValue] = useState(200);
  const [minBillAmount, setMinBillAmount] = useState(1000);
  const [maxDiscount, setMaxDiscount] = useState(500);
  const [validFrom, setValidFrom] = useState("2026-10-01");
  const [validTo, setValidTo] = useState("2026-10-31");
  const [terms, setTerms] = useState("Valid on all dine-in bills exceeding threshold.");

  const selectedMerchant = merchants.find((m) => m.id === merchantId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create Platform Campaign
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Merchant Brand</label>
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.businessName} ({m.city})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Special Fest"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="FLAT_AMT">Flat Amount (₹)</option>
                  <option value="FLAT_PCT">Percentage (%)</option>
                  <option value="CASHBACK">Cashback (₹)</option>
                  <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {type === "FLAT_AMT" ? "Flat Value (₹)" : type === "FLAT_PCT" ? "Percentage (%)" : type === "CASHBACK" ? "Cashback (₹)" : "Qty"}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Min Bill Amount (₹)</label>
                <input
                  type="number"
                  value={minBillAmount}
                  onChange={(e) => setMinBillAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Max Cap (₹)</label>
                <input
                  type="number"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Valid From</label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Valid Until</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                rows={3}
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
            <button
              onClick={() => {
                onSave({
                  merchantId,
                  merchantName: selectedMerchant?.businessName || "Merchant",
                  title,
                  type,
                  value,
                  minBillAmount,
                  maxDiscount,
                  validFrom,
                  validTo,
                  terms,
                  status: "ACTIVE"
                });
                toast.success(`Platform offer "${title}" published!`);
              }}
              disabled={!title}
              className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
            >
              Publish Campaign
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
