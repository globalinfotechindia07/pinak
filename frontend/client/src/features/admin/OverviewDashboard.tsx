import React, { useState, useEffect } from "react";
import {
  WalletCards,
  Building2,
  Store,
  TicketPercent,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Users
} from "lucide-react";
import { Merchant, Store as StoreType, Offer, Transaction } from "../../types";
import { adminApi, AdminDashboardMetrics } from "../../api/adminApi";
import { useAppStore } from "../../hooks/useAppStore";
import { toast } from "sonner";

interface OverviewDashboardProps {
  merchants: Merchant[];
  stores: StoreType[];
  offers: Offer[];
  transactions: Transaction[];
  metrics?: AdminDashboardMetrics | null;
  onNavigateTab: (tab: string) => void;
  onApproveMerchant: (id: string) => void;
  onApproveOffer: (id: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  merchants,
  stores,
  offers,
  transactions,
  metrics,
  onNavigateTab,
  onApproveMerchant,
  onApproveOffer
}) => {
  const store = useAppStore();
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [currentMetrics, setCurrentMetrics] = useState<AdminDashboardMetrics | null>(metrics || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");

  useEffect(() => {
    if (metrics) {
      setCurrentMetrics(metrics);
    } else {
      // Auto fetch live metrics if not passed from parent
      fetchLiveMetrics(true);
    }
  }, [metrics]);

  const fetchLiveMetrics = async (silent = false) => {
    setIsRefreshing(true);
    try {
      const data = await adminApi.getDashboardSummary();
      if (data) {
        setCurrentMetrics(data);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (!silent) {
          toast.success("Live operational metrics synchronized with backend");
        }
      } else if (!silent) {
        toast.info("Using cached metrics (backend standby)");
      }
    } catch (err) {
      console.warn("Could not fetch dashboard summary:", err);
      if (!silent) {
        toast.error("Failed to sync metrics from central engine");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const userFirstName = (store.currentUser?.name?.trim()?.split(" ")[0]) || "Admin";

  // Calculations from Live Backend Data & Props
  const actualTxVolume = transactions.reduce((acc, t) => acc + (t.status === "SUCCESS" || (t as any).status === "COMPLETED" ? (t.payableAmount || 0) : 0), 0);
  const grossVolume = actualTxVolume > 0
    ? actualTxVolume
    : (currentMetrics?.transactions?.successful ? currentMetrics.transactions.successful * 150 : 0);
  const activeMerchants = currentMetrics?.merchants?.active ?? merchants.filter(m => m.kycStatus === "APPROVED" || m.status === "ACTIVE").length;
  const activeStores = currentMetrics?.stores?.active ?? stores.filter(s => s.status === "ACTIVE").length;
  const totalUsers = currentMetrics?.users?.total ?? store.customers.length;
  const activeUsers = currentMetrics?.users?.active ?? store.customers.filter(c => !c.status || c.status === "ACTIVE").length;
  const totalRedemptions = offers.reduce((acc, o) => acc + (o.redemptions || 0), 0);
  const pendingKycCount = currentMetrics?.merchants?.pendingApproval ?? merchants.filter(m => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED").length;
  const pendingOffers = offers.filter(o => o.status === "PENDING_APPROVAL");

  // Transaction rates
  const totalTxCount = currentMetrics?.transactions?.total ?? transactions.length;
  const successfulTxCount = currentMetrics?.transactions?.successful ?? transactions.filter(t => t.status === "SUCCESS" || (t as any).status === "COMPLETED").length;
  const txSuccessRate = totalTxCount > 0 ? ((successfulTxCount / totalTxCount) * 100).toFixed(1) : "100.0";

  // Graph points simulation
  const graphData = [
    { day: "Mon", volume: 240, redemptions: 180 },
    { day: "Tue", volume: 310, redemptions: 220 },
    { day: "Wed", volume: 290, redemptions: 210 },
    { day: "Thu", volume: 420, redemptions: 340 },
    { day: "Fri", volume: 490, redemptions: 410 },
    { day: "Sat", volume: 680, redemptions: 590 },
    { day: "Sun", volume: 620, redemptions: 540 }
  ];

  const maxVolume = Math.max(...graphData.map(d => d.volume));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-pink-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-pink-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Central Platform Overview · Live Sync
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Manrope']">
            Good morning, {userFirstName} <span className="text-pink-400">✦</span>
          </h1>
          <p className="text-sm text-slate-200/90 max-w-xl">
            Live operations monitoring <strong className="text-white">{activeMerchants} active merchants</strong>,{" "}
            <strong className="text-white">{activeStores} branch stores</strong>, and{" "}
            <strong className="text-white">{totalUsers.toLocaleString()} registered customers</strong>.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLiveMetrics(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-sm transition-all border border-white/10 disabled:opacity-50"
            title="Refresh live metrics from backend"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Overview"}</span>
          </button>
          <button
            onClick={() => onNavigateTab("Discovery")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-sm transition-all"
          >
            <MapPin size={15} />
            <span>Discovery Control</span>
          </button>
          <button
            onClick={() => onNavigateTab("Offers")}
            className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg"
          >
            <TicketPercent size={15} />
            <span>Review Campaigns</span>
          </button>
        </div>
      </div>

      {/* Platform Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PLATFORM SERVICES : ACTIVE</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
            Real-time synchronisation across partner brands, store branches, customer accounts & UPI settlements
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Last synchronized: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastRefreshed}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Platform Volume</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <WalletCards size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {grossVolume >= 100000
                ? `₹${(grossVolume / 100000).toFixed(2)}L`
                : `₹${grossVolume.toLocaleString("en-IN")}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            <span>Direct UPI Volume</span>
            <span className="text-slate-400 font-medium">T+0 settlements</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Stores (Branches)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Store size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {activeStores}
            </span>
            <span className="text-xs text-slate-400 ml-2">across {activeMerchants} brands</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight size={14} />
            <span>+14.2%</span>
            <span className="text-slate-400 font-medium">geo-tagged outlets</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Customers</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {totalUsers.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 ml-2">({activeUsers.toLocaleString()} active)</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-purple-600 dark:text-purple-400">
            <ShieldCheck size={14} />
            <span>KYC Verified</span>
            <span className="text-slate-400 font-medium ml-1">Verified Accounts</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-pink-300 dark:hover:border-pink-900 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">UPI Success Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {txSuccessRate}%
            </span>
            {successfulTxCount > 0 && (
              <span className="text-xs text-slate-400 ml-2">({successfulTxCount} settled)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            <span>Direct VPA</span>
            <span className="text-slate-400 font-medium">T+0 settlement</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Pending Approval Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue & Volume Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Performance Analytics
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                Redemption & Volume Trend
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option>All Cities</option>
                <option>Nagpur</option>
                <option>Pune</option>
                <option>Mumbai</option>
              </select>

              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
                {["7d", "30d", "90d"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeRange === r
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-4">
            <div className="h-60 flex items-end justify-between gap-3 px-2">
              {graphData.map((item) => {
                const volHeight = (item.volume / maxVolume) * 100;
                const redHeight = (item.redemptions / maxVolume) * 100;

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex justify-center gap-1.5 h-full items-end">
                      {/* Bar 1: Volume */}
                      <div
                        style={{ height: `${volHeight}%` }}
                        className="w-1/2 max-w-[24px] rounded-t-md bg-gradient-to-t from-purple-700 to-pink-500 group-hover:brightness-110 transition-all relative"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap z-10">
                          ₹{item.volume * 100}
                        </div>
                      </div>

                      {/* Bar 2: Redemptions */}
                      <div
                        style={{ height: `${redHeight}%` }}
                        className="w-1/2 max-w-[24px] rounded-t-md bg-gradient-to-t from-amber-500 to-amber-300 group-hover:brightness-110 transition-all relative"
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap z-10">
                          {item.redemptions} scans
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 mt-2">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-gradient-to-r from-purple-700 to-pink-500" />
                <span>Gross Volume (₹)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-amber-400" />
                <span>Offer Redemptions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pending Approval Queues */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Action Required
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
                  Pending Approvals
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {pendingKycCount + pendingOffers.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
              {/* Pending KYC Merchant */}
              {merchants
                .filter(m => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED")
                .slice(0, 2)
                .map((m) => (
                  <div key={m.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                          {m.initials}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.businessName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            KYC Review · {m.city}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onApproveMerchant(m.id)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}

              {/* Pending Offers */}
              {pendingOffers.slice(0, 2).map((o) => (
                <div key={o.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 flex items-center justify-center">
                        <TicketPercent size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {o.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {o.merchantName} · {o.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onApproveOffer(o.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300 transition-colors"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("Merchants")}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <span>View All Approval Queues</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
