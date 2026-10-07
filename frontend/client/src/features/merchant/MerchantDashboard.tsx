import React from "react";
import {
  WalletCards,
  TicketPercent,
  Users,
  Sparkles,
  ArrowUpRight,
  Plus,
  Zap,
  Store,
  QrCode,
  Receipt
} from "lucide-react";
import { Store as StoreType, Offer, Transaction } from "../../types";
import { Badge } from "../../components/ui/badge";
import { useAppStore } from "../../hooks/useAppStore";

interface MerchantDashboardProps {
  stores: StoreType[];
  offers: Offer[];
  transactions: Transaction[];
  onNavigateTab: (tab: string) => void;
  onOpenQR: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  stores,
  offers,
  transactions,
  onNavigateTab,
  onOpenQR
}) => {
  const store = useAppStore();
  const currentMerchantId = store.currentUser?.merchantId || store.currentUser?.id;
  const merchantName = store.currentUser?.name || "Merchant Partner";
  
  const isMyMerchant = (id?: string) => {
    if (!currentMerchantId) return true;
    return !id || id === currentMerchantId || id === store.currentUser?.merchantId || id === "m-1";
  };
  const myStores = store.role === "merchant" ? stores : stores.filter(s => isMyMerchant(s.merchantId));
  const myOffers = store.role === "merchant" ? offers : offers.filter(o => isMyMerchant(o.merchantId));
  const myTransactions = store.role === "merchant" ? transactions : transactions.filter(t => isMyMerchant(t.merchantId));

  const totalRevenue = myTransactions.reduce((acc, t) => acc + (t.status === "SUCCESS" || (t as any).status === "COMPLETED" ? t.payableAmount : 0), 0);
  const totalRedemptions = myOffers.reduce((acc, o) => acc + o.redemptions, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-rose-600 to-purple-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Merchant Partner Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Manrope']">
            Welcome back, {merchantName}
          </h1>
          <p className="text-sm text-white/90 max-w-xl">
            Managing <strong className="text-white">{myStores.length} branch {myStores.length === 1 ? "store" : "stores"}</strong> with direct UPI settlements active.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2.5">
          <button
            onClick={onOpenQR}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg"
          >
            <QrCode size={16} />
            <span>Counter QR Standee</span>
          </button>
          <button
            onClick={() => onNavigateTab("OfferStudio")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-sm transition-all"
          >
            <Plus size={16} />
            <span>New Offer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">30-Day Sales Volume</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(2)}L` : `₹${totalRevenue.toLocaleString('en-IN')}`}
          </p>
          <span className="text-xs text-emerald-600 font-bold">+22.4% vs last month</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Offers Redeemed</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            {totalRedemptions.toLocaleString()}
          </p>
          <span className="text-xs text-emerald-600 font-bold">+31.8% scans</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Repeat Customer Rate</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            68.4%
          </p>
          <span className="text-xs text-emerald-600 font-bold">2.1× higher than non-app</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Store Rating</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">
            4.8 ★
          </p>
          <span className="text-xs text-slate-400 font-medium">842 verified reviews</span>
        </div>
      </div>

      {/* Grid: Active Stores & Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stores Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Store Network
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                My Physical Branch Stores ({myStores.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("BranchStores")}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Manage Branches
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myStores.map((s) => (
              <div key={s.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Store size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.branchName}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">
                      {s.address}, {s.city}
                    </p>
                  </div>
                </div>
                <Badge className="badge-status badge-approved text-[11px] border shadow-none">
                  Active on Map
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Active Offers Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Live Promotions
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Campaigns Active on App
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab("OfferStudio")}
              className="text-xs font-bold text-pink-600 dark:text-pink-400 hover:underline"
            >
              Offer Studio
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myOffers.map((o) => (
              <div key={o.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
                    <TicketPercent size={17} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {o.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {o.type === "FLAT_AMT" ? `Flat ₹${o.value} Off` : `${o.value}% Off`} · Min bill ₹{o.minBillAmount}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    {o.redemptions}
                  </span>
                  <span className="text-[10px] text-slate-400">redemptions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
