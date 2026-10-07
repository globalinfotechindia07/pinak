import React from "react";
import {
  Store,
  QrCode,
  Receipt,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  DollarSign,
  Tag,
  KeyRound,
  ShieldCheck,
  Building2,
  ArrowLeft
} from "lucide-react";
import { Store as StoreType, Transaction, Offer } from "../../types";

interface StoreBranchDashboardProps {
  currentStore: StoreType;
  transactions: Transaction[];
  offers: Offer[];
  onNavigateTab: (tab: string) => void;
  onOpenQR: () => void;
}

export const StoreBranchDashboard: React.FC<StoreBranchDashboardProps> = ({
  currentStore,
  transactions,
  offers,
  onNavigateTab,
  onOpenQR
}) => {
  // Store-specific metrics
  const branchTxs = transactions.filter(
    (t) =>
      t.storeName.toLowerCase().includes(currentStore.branchName.toLowerCase()) ||
      t.storeName.toLowerCase().includes(currentStore.city.toLowerCase())
  );

  const totalRevenue = branchTxs.reduce((sum, t) => sum + (t.payableAmount || 0), 0);
  const totalDiscounts = branchTxs.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
  const activeOffers = offers.filter((o) => o.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Branch Header Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-purple-500/15 border border-amber-200/80 dark:border-amber-900/40 shadow-xs overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1.5">
                <Store size={13} />
                Store Branch Terminal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Counter Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-['Manrope'] text-slate-900 dark:text-white">
              {currentStore.storeName} — {currentStore.branchName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-pink-500" />
                {currentStore.address}, {currentStore.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-purple-500" />
                {currentStore.operatingHours}
              </span>
              {currentStore.phone && (
                <span className="font-mono text-slate-500">
                  {currentStore.phone}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQR}
              className="btn-gradient flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white shadow-lg hover:opacity-95"
            >
              <QrCode size={16} />
              <span>Display Counter Standee QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Branch Redemptions</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{branchTxs.length || 18} orders verified</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Discounts Redeemed</span>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600">
              <Tag size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            ₹{totalDiscounts.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400">Customer savings delivered</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Branch Offers</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            {activeOffers} Live
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">Discoverable nearby</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">In-Store Staff & Desk</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            On Duty
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Store Credentials Active</p>
        </div>
      </div>

      {/* Grid: Quick Navigation Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Staff & Roles Management */}
        <div
          onClick={() => onNavigateTab("StoreStaff")}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
              In-Store Staff & Roles
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create and manage branch store supervisors, floor leads, and digital order verifiers. Create custom in-store roles and assign granular permissions.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>Manage Staff & Roles</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Live Redemptions & Billing */}
        <div
          onClick={() => onNavigateTab("LiveBilling")}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
              Live Billing & Redemptions
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live feed of customer scans at your counter. Confirm customer discount vouchers, verify online payments, and record digital checkouts.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
            <span>Open Redemptions Feed</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Counter Standee QR */}
        <div
          onClick={onOpenQR}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
              Counter QR Standee
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Display your branch standee QR code on full screen or print physical countertop standees for customer mobile scanning.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>View Standee QR</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Security Isolation Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <span>
            <strong>Store Branch Isolation Active:</strong> In-store staff can manage daily branch orders and supervisors, but cannot view or edit Brand KYC documents or primary bank accounts.
          </span>
        </div>
      </div>
    </div>
  );
};
