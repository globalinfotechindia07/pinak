import React, { useState } from "react";
import { TicketPercent, Plus, CheckCircle2, Clock, XCircle, Sparkles, X, LayoutGrid, List, QrCode, Eye, ShieldCheck, Tag, History } from "lucide-react";
import { Offer, Store } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { useAppStore } from "../../hooks/useAppStore";
import { OfferCampaignFormDrawer } from "../../components/OfferCampaignFormDrawer";
import { OfferDetailsDrawer } from "../../components/OfferDetailsDrawer";

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
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const currentMerchantName = store.currentUser?.name || "Merchant Partner";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const isMyMerchant = (id?: string) => !currentMerchantId || !id || id === currentMerchantId || id === store.currentUser?.merchantId || id === "m-1";
  const myOffers = store.role === "merchant" ? offers : offers.filter((o) => isMyMerchant(o.merchantId));

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
          {o.redemptions} used
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
              : o.status === "PENDING_APPROVAL"
              ? "badge-pending"
              : "badge-rejected"
          )}
        >
          {o.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {o.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      header: "Actions",
      className: "text-right",
      render: (o) => (
        <button
          onClick={() => setSelectedOffer(o)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40"
        >
          <Eye size={12} />
          <span>Details & History</span>
        </button>
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
            Create financial discount campaigns with fraud caps, store targeting, time scheduling & audit trails.
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
                  <Badge
                    className={cn(
                      "badge-status border shadow-none",
                      o.status === "ACTIVE"
                        ? "badge-approved"
                        : o.status === "PENDING_APPROVAL"
                        ? "badge-pending"
                        : "badge-rejected"
                    )}
                  >
                    {o.status === "ACTIVE" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {o.status.replace("_", " ")}
                  </Badge>
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
                <button
                  onClick={() => setSelectedOffer(o)}
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
          subtitle={`${myOffers.length} discount rules mapped to branch storefronts`}
          columns={columns}
          data={myOffers}
          keyExtractor={(o) => o.id}
          searchPlaceholder="Search offer campaign, terms, or discount..."
        />
      )}

      {/* Create Offer Campaign Drawer */}
      {isCreateOpen && (
        <OfferCampaignFormDrawer
          merchantId={currentMerchantId}
          merchantName={currentMerchantName}
          stores={stores}
          onClose={() => setIsCreateOpen(false)}
          onSave={(draft) => {
            onAddOffer(draft);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* Offer Inspector & Audit Drawer */}
      {selectedOffer && (
        <OfferDetailsDrawer
          offer={selectedOffer}
          stores={stores}
          auditLogs={store.auditLogs}
          isAdmin={false}
          onClose={() => setSelectedOffer(null)}
        />
      )}
    </div>
  );
};
