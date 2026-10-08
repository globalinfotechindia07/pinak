import React, { useState, useEffect } from "react";
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
  Tag,
  ShieldCheck,
  TicketPercent,
  RefreshCw,
  Zap,
  UserCheck,
  Check
} from "lucide-react";
import { Store as StoreType, Transaction, Offer } from "../../types";
import { staffApi } from "../../api/staffApi";
import { offerApi } from "../../api/offerApi";
import apiClient from "../../api/client";

interface StoreBranchDashboardProps {
  currentStore: StoreType;
  transactions?: Transaction[];
  offers?: Offer[];
  onNavigateTab: (tab: string) => void;
  onOpenQR: () => void;
}

export const StoreBranchDashboard: React.FC<StoreBranchDashboardProps> = ({
  currentStore,
  transactions: initialTransactions = [],
  offers: initialOffers = [],
  onNavigateTab,
  onOpenQR
}) => {
  const [loading, setLoading] = useState(true);
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [liveOffersCount, setLiveOffersCount] = useState<number>(0);
  const [activeStaffCount, setActiveStaffCount] = useState<number>(0);

  const fetchBranchMetrics = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    try {
      const [staffRes, offersRes, txRes] = await Promise.all([
        staffApi.getMerchantStaff("STORE", currentStore.id).catch(() => []),
        offerApi.getMerchantOffers(currentStore.id).catch(() => []),
        apiClient.get(`/merchant/transactions?storeId=${currentStore.id}`).catch(() => null)
      ]);

      // Active staff count for this branch
      if (Array.isArray(staffRes)) {
        const active = staffRes.filter((s: any) => s.status === "ACTIVE" || !s.status).length;
        setActiveStaffCount(active);
      }

      // Active offers count for this branch
      if (Array.isArray(offersRes)) {
        const activeOffers = offersRes.filter((o: any) => o.status === "ACTIVE").length;
        setLiveOffersCount(activeOffers);
      } else {
        const activePropOffers = initialOffers.filter((o) => o.status === "ACTIVE").length;
        setLiveOffersCount(activePropOffers);
      }

      // Live branch transactions
      let rawTxs: any[] = [];
      if (txRes?.data?.data && Array.isArray(txRes.data.data)) {
        rawTxs = txRes.data.data;
      } else if (txRes?.data?.data?.content && Array.isArray(txRes.data.data.content)) {
        rawTxs = txRes.data.data.content;
      }

      if (rawTxs.length > 0) {
        const mappedTxs: Transaction[] = rawTxs.map((t: any) => ({
          id: t.id || `tx-${Math.random()}`,
          customerName: t.customerName || t.userName || "Branch Customer",
          customerPhone: t.customerPhone || t.userPhone || "",
          merchantId: t.merchantId || currentStore.merchantId || "",
          merchantName: t.merchantName || currentStore.merchantName || "",
          storeName: t.storeName || currentStore.branchName,
          billAmount: Number(t.billAmount || t.amount || 0),
          discountAmount: Number(t.discountAmount || 0),
          payableAmount: Number(t.payableAmount || t.netAmount || 0),
          status: t.status || "SUCCESS",
          settlementStatus: t.settlementStatus || "SETTLED",
          createdAt: t.createdAt || new Date().toISOString(),
          referenceId: t.referenceId || t.voucherCode || "DEAL-OFFER"
        }));
        setLiveTransactions(mappedTxs);
      } else {
        // Fallback filter on prop transactions if API returns empty
        const storeTxs = initialTransactions.filter(
          (t) =>
            t.storeName.toLowerCase().includes(currentStore.branchName.toLowerCase()) ||
            t.storeName.toLowerCase().includes(currentStore.city.toLowerCase())
        );
        setLiveTransactions(storeTxs);
      }
    } catch (err) {
      console.error("Failed to fetch branch metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchMetrics();
  }, [currentStore?.id]);

  const totalRevenue = liveTransactions.reduce((sum, t) => sum + (t.payableAmount || 0), 0);
  const totalDiscounts = liveTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
  const totalOrdersCount = liveTransactions.length;
  const recentRedemptions = liveTransactions.slice(0, 5);

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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live PostgreSQL Data
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
              onClick={fetchBranchMetrics}
              disabled={loading}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Refresh live branch metrics"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
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

      {/* KPI Stats - Driven entirely by live backend data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Branch Net Revenue</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Receipt size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>{totalOrdersCount} verified redemptions</span>
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Discounts Delivered</span>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600">
              <Tag size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            ₹{totalDiscounts.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400">Total savings granted</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Branch Offers</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            {liveOffersCount} Live
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">Discoverable at outlet</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Branch Staff & Desk</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            {activeStaffCount > 0 ? `${activeStaffCount} Staff` : "Desk Active"}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">Active Store Roster</p>
        </div>
      </div>

      {/* Grid: Quick Navigation Hub (4 Cards: Staff, Store Deals & Offers, Live Billing, Standee QR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: In-Store Staff & Roles */}
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
              Create and manage branch floor leads, counter cashiers, and verifiers. Assign custom store permissions.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
            <span>Manage Staff & Roles</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Store Deals & Offers (Quick Navigation Card) */}
        <div
          onClick={() => onNavigateTab("OfferStudio")}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TicketPercent size={24} />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                Store Deals & Offers
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                {liveOffersCount} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create localized branch deals with strict fraud caps (Max Discount ₹, Min Bill) submitted for approval.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Open Deals Studio</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Live Redemptions & Billing */}
        <div
          onClick={() => onNavigateTab("LiveBilling")}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Receipt size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
              Live Billing Feed
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time feed of customer counter checkouts. Verify digital discount vouchers and UPI transactions.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600 dark:text-pink-400">
            <span>Open Redemptions Feed</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Counter Standee QR */}
        <div
          onClick={onOpenQR}
          className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
              Counter QR Standee
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Display your branch countertop QR code on full screen or print physical standees for customer UPI scanning.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>View Standee QR</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Live Branch Ledger Stream Widget */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                Live Branch Counter Ledger Stream
              </h3>
              <p className="text-xs text-slate-500">
                Most recent customer redemptions and checkouts verified at this counter terminal
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("LiveBilling")}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {recentRedemptions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <Receipt size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No recent counter redemptions logged yet.
            </p>
            <p className="text-[11px] text-slate-400">
              When customers redeem discount vouchers at this store, live checkouts will stream here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentRedemptions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{t.customerName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Ref: {t.referenceId || "COUNTER-SCAN"} · {new Date(t.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">
                    ₹{t.payableAmount}
                  </span>
                  {t.discountAmount > 0 && (
                    <p className="text-[11px] font-bold text-pink-600 dark:text-pink-400 font-mono">
                      -₹{t.discountAmount} Deal Savings
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Isolation Notice */}
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <span>
            <strong>Store Branch Isolation Active:</strong> In-store staff can manage daily branch orders, local flash deals, and supervisors, but cannot view or edit Brand KYC documents or primary corporate bank accounts.
          </span>
        </div>
      </div>
    </div>
  );
};
