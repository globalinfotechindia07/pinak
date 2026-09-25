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
  Layers
} from "lucide-react";
import { Offer, Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface OfferGovernanceProps {
  offers: Offer[];
  merchants: Merchant[];
  onAddOffer: (draft: Partial<Offer>) => void;
  onUpdateOfferStatus: (id: string, status: "ACTIVE" | "REJECTED" | "EXPIRED") => void;
}

export const OfferGovernance: React.FC<OfferGovernanceProps> = ({
  offers,
  merchants,
  onAddOffer,
  onUpdateOfferStatus
}) => {
  const [filter, setFilter] = useState("ALL");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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
        <span
          className={`badge-status ${
            o.status === "ACTIVE"
              ? "badge-approved"
              : o.status === "REJECTED" || o.status === "EXPIRED"
              ? "badge-rejected"
              : "badge-pending"
          }`}
        >
          {o.status === "ACTIVE" ? (
            <CheckCircle2 size={12} />
          ) : o.status === "PENDING_APPROVAL" ? (
            <Clock size={12} />
          ) : (
            <XCircle size={12} />
          )}
          {o.status.replace("_", " ")}
        </span>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (o) => (
        <button
          onClick={() => setSelectedOffer(o)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors shadow-2xs"
        >
          <Eye size={13} />
          <span>Review</span>
        </button>
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

      {/* Filter Status Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
        {["ALL", "ACTIVE", "PENDING_APPROVAL", "EXPIRED", "REJECTED"].map((st) => (
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Discount Value</p>
                    <p className="text-base font-extrabold text-pink-600 dark:text-pink-400 mt-0.5">
                      {selectedOffer.type === "FLAT_AMT"
                        ? `₹${selectedOffer.value} Off`
                        : `${selectedOffer.value}% Off`}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-slate-400 font-semibold uppercase text-[10px]">Min Spend</p>
                    <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      ₹{selectedOffer.minBillAmount}
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
                    <span className="text-slate-400">Total Redemptions:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedOffer.redemptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valid Until:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{selectedOffer.validTo}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onUpdateOfferStatus(selectedOffer.id, "REJECTED");
                    setSelectedOffer(null);
                    toast.error(`Offer campaign rejected`);
                  }}
                  className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                >
                  Reject Deal
                </button>
                <button
                  onClick={() => {
                    onUpdateOfferStatus(selectedOffer.id, "ACTIVE");
                    setSelectedOffer(null);
                    toast.success(`Offer published to customer discovery!`);
                  }}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md"
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

  const selectedMerchant = merchants.find(m => m.id === merchantId);

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
              <label className="font-bold text-slate-700 dark:text-slate-300">Merchant</label>
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
              <label className="font-bold text-slate-700 dark:text-slate-300">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Weekend Special Fest"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Discount Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="FLAT_AMT">Flat Amount (₹)</option>
                  <option value="FLAT_PCT">Percentage (%)</option>
                  <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {type === "FLAT_AMT" ? "Flat Value (₹)" : type === "FLAT_PCT" ? "Percentage (%)" : "Qty"}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Min Bill Amount (₹)</label>
                <input
                  type="number"
                  value={minBillAmount}
                  onChange={e => setMinBillAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Valid Until</label>
                <input
                  type="date"
                  value={validTo}
                  onChange={e => setValidTo(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
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
