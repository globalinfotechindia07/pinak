import React, { useState } from "react";
import { TicketPercent, Plus, CheckCircle2, Clock, XCircle, Sparkles, X, LayoutGrid, List, QrCode } from "lucide-react";
import { Offer, Store } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { toast } from "sonner";

interface OfferStudioProps {
  offers: Offer[];
  stores: Store[];
  onAddOffer: (draft: Partial<Offer>) => void;
  onOpenQR: () => void;
}

export const OfferStudio: React.FC<OfferStudioProps> = ({
  offers,
  stores,
  onAddOffer,
  onOpenQR
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const myOffers = offers.filter((o) => o.merchantId === "m-1");

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"FLAT_PCT" | "FLAT_AMT" | "BOGO">("FLAT_AMT");
  const [value, setValue] = useState(150);
  const [minBill, setMinBill] = useState(800);
  const [validTo, setValidTo] = useState("2026-10-31");
  const [terms, setTerms] = useState("Valid on all dine-in bills exceeding minimum threshold.");

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
            <p className="text-[11px] text-slate-400">Min spend: ₹{o.minBillAmount}</p>
          </div>
        </div>
      )
    },
    {
      header: "Discount Value",
      sortable: true,
      accessor: "value",
      render: (o) => (
        <span className="font-extrabold text-pink-600 dark:text-pink-400 font-mono text-xs">
          {o.type === "FLAT_AMT"
            ? `Flat ₹${o.value} Off`
            : o.type === "FLAT_PCT"
            ? `${o.value}% Off`
            : "Buy 1 Get 1"}
        </span>
      )
    },
    {
      header: "Redemptions",
      sortable: true,
      accessor: "redemptions",
      render: (o) => (
        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {o.redemptions} used
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
      header: "Verification Status",
      sortable: true,
      accessor: "status",
      render: (o) => (
        <span
          className={`badge-status ${
            o.status === "ACTIVE"
              ? "badge-approved"
              : o.status === "PENDING_APPROVAL"
              ? "badge-pending"
              : "badge-rejected"
          }`}
        >
          {o.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {o.status.replace("_", " ")}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Merchant Offer Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create reward campaigns for your stores. Offers go through admin verification before publishing to mobile discovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
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

          <button
            onClick={onOpenQR}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs"
          >
            <QrCode size={15} className="text-pink-600" />
            <span>Counter Standee</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Create New Offer</span>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        /* Offers Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myOffers.map((o) => (
            <div
              key={o.id}
              className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300 flex items-center justify-center">
                    <TicketPercent size={20} />
                  </div>
                  <span
                    className={`badge-status ${
                      o.status === "ACTIVE"
                        ? "badge-approved"
                        : o.status === "PENDING_APPROVAL"
                        ? "badge-pending"
                        : "badge-rejected"
                    }`}
                  >
                    {o.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {o.status.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                    {o.title}
                  </h3>
                  <p className="text-xl font-extrabold text-pink-600 dark:text-pink-400 mt-1 font-['Manrope']">
                    {o.type === "FLAT_AMT"
                      ? `Flat ₹${o.value} Off`
                      : o.type === "FLAT_PCT"
                      ? `${o.value}% Off`
                      : "Buy 1 Get 1"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Min bill requirement: ₹{o.minBillAmount}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Terms:</p>
                  <p className="line-clamp-2">{o.terms}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {o.redemptions} Redemptions
                </span>
                <span className="text-slate-400">Valid to {o.validTo}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Offers Advanced Table */
        <AdvancedTable
          title="Offer Campaigns Inventory"
          subtitle={`${myOffers.length} discount rules mapped to branch storefronts`}
          columns={columns}
          data={myOffers}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search offer campaign, terms, or discount..."
        />
      )}

      {/* Create Offer Right Slide-Over Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setIsCreateOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <TicketPercent size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Offer Campaign</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Offer Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lunch Hour Delight"
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
                      <option value="BOGO">Buy 1 Get 1 (BOGO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Value</label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Min Bill (₹)</label>
                    <input
                      type="number"
                      value={minBill}
                      onChange={(e) => setMinBill(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Valid To</label>
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
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

                {/* Live Preview Card */}
                <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/60 dark:border-pink-900/50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400">Customer App Badge Preview</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{title || "Your Campaign Title"}</p>
                  <p className="text-pink-600 dark:text-pink-400 font-extrabold text-base">
                    {type === "FLAT_AMT" ? `Flat ₹${value} Off` : type === "FLAT_PCT" ? `${value}% Off` : "Buy 1 Get 1"}
                  </p>
                  <p className="text-slate-400 text-[11px]">Valid on orders above ₹{minBill}</p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cancel</button>
                <button
                  onClick={() => {
                    onAddOffer({
                      merchantId: "m-1",
                      merchantName: "The Curry Leaf",
                      title,
                      type,
                      value,
                      minBillAmount: minBill,
                      validTo,
                      terms
                    });
                    setIsCreateOpen(false);
                    toast.success(`Offer "${title}" submitted for Super-Admin approval!`);
                  }}
                  disabled={!title}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 shadow-md"
                >
                  Submit for Approval
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
