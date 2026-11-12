import { cashbackApi } from "../../api/cashbackApi";
import { CashbackSetting, StoreCashback } from "../../types";
import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Plus,
  TicketPercent,
  WalletCards,
  TrendingUp,
  CheckCircle2,
  X,
  Award,
  Users,
  RefreshCw,
  Server,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  SlidersHorizontal,
  History,
  ShieldCheck,
  Percent,
  Save,
  Edit3,
  Check,
  Calculator,
  Download,
  Copy,
  Search,
  Building2,
  MapPin,
  Sliders,
  AlertTriangle,
  HelpCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Gift
} from "lucide-react";
import { RewardRule, Customer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { rewardApi, RewardLedgerItemDTO, CustomerRewardAccountDTO, WelcomeBonusSettingDTO } from "../../api/rewardApi";
import { toast } from "sonner";

interface RewardsEconomyProps {
  rewardRules: RewardRule[];
  customers: Customer[];
  onAddRule: (rule: Partial<RewardRule>) => void;
}

export const RewardsEconomy: React.FC<RewardsEconomyProps> = ({
  rewardRules,
  customers,
  onAddRule
}) => {
  const [activeTab, setActiveTab] = useState<"cashback" | "welcome_bonus" | "ledger" | "programs">("cashback");
  const [ledgerItems, setLedgerItems] = useState<RewardLedgerItemDTO[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "EARN" | "REDEEM" | "ADJUSTMENT">("ALL");
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");

  // Rule creation modal
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [earnRate, setEarnRate] = useState(5);
  const [category, setCategory] = useState("All categories");
  const [description, setDescription] = useState("");

  // Manual Adjustment modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [pointsDelta, setPointsDelta] = useState<number>(250);
  const [adjustReason, setAdjustReason] = useState("VIP Member Goodwill Credit");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Super Admin Transaction Cashback Settings
  const [cashbackSetting, setCashbackSetting] = useState<CashbackSetting>({
    enabled: true,
    defaultPercentage: 5,
    maxCashbackPerTransaction: 150,
    minTransactionAmount: 100,
    rewardMode: "COINS",
    cashbackName: "PINAK Instant Transaction Cashback",
    applyToAllStores: false
  });
  const [storesCashback, setStoresCashback] = useState<StoreCashback[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<CustomerRewardAccountDTO[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingCashback, setIsLoadingCashback] = useState(false);
  const [isSavingCashback, setIsSavingCashback] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  // Interactive Live Simulator State
  const [simBillAmount, setSimBillAmount] = useState<number>(2000);

  // Store Table Filtering & Pagination
  const [storeSearch, setStoreSearch] = useState<string>("");
  const [storeStatusFilter, setStoreStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [storeCityFilter, setStoreCityFilter] = useState<string>("all");
  const [storePage, setStorePage] = useState<number>(1);
  const STORES_PER_PAGE = 8;

  // Edit Single Store Cashback Modal
  const [editingStore, setEditingStore] = useState<StoreCashback | null>(null);
  const [isSavingStoreCashback, setIsSavingStoreCashback] = useState(false);

  // Super Admin First-Time User Welcome Coins Setting
  const [welcomeBonusSetting, setWelcomeBonusSetting] = useState<WelcomeBonusSettingDTO>({
    enabled: true,
    coins: 100,
    couponCode: "WELCOME100",
    description: "Instant Welcome Bonus for first-time mobile signup"
  });
  const [isSavingWelcomeBonus, setIsSavingWelcomeBonus] = useState(false);

  const fetchWelcomeBonusSetting = async () => {
    try {
      const data = await rewardApi.getWelcomeBonusSetting();
      if (data) setWelcomeBonusSetting(data);
    } catch (err) {
      console.warn("Could not fetch welcome bonus setting:", err);
    }
  };

  const handleSaveWelcomeBonus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingWelcomeBonus(true);
    try {
      const updated = await rewardApi.updateWelcomeBonusSetting(welcomeBonusSetting);
      if (updated) {
        setWelcomeBonusSetting(updated);
        toast.success("Welcome Bonus Setting Updated!", {
          description: `First-time users will receive ${updated.coins} PINAK Coins on their first OTP verification.`
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update welcome bonus setting");
    } finally {
      setIsSavingWelcomeBonus(false);
    }
  };

  const fetchCustomerAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const data = await rewardApi.getAllAccounts();
      if (data && data.length > 0) {
        setCustomerAccounts(data);
      }
    } catch (err: any) {
      console.warn("Could not fetch customer accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchCashbackData = async () => {
    setIsLoadingCashback(true);
    try {
      const [settings, stores] = await Promise.all([
        cashbackApi.getGlobalSettings(),
        cashbackApi.getAllStoresCashback()
      ]);
      if (settings) setCashbackSetting(settings);
      if (stores) setStoresCashback(stores);
    } catch (err: any) {
      console.warn("Could not fetch cashback settings:", err);
    } finally {
      setIsLoadingCashback(false);
    }
  };

  const handleSaveGlobalCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCashback(true);
    try {
      const updated = await cashbackApi.updateGlobalSettings({
        ...cashbackSetting,
        applyToAllStores: applyToAll
      });
      setCashbackSetting(updated);
      toast.success(applyToAll 
        ? "Global cashback policy saved and propagated to all stores successfully!" 
        : "Global cashback settings updated successfully!");
      const refreshedStores = await cashbackApi.getAllStoresCashback();
      setStoresCashback(refreshedStores);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update cashback settings");
    } finally {
      setIsSavingCashback(false);
    }
  };

  const handleSaveStoreCashback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setIsSavingStoreCashback(true);
    try {
      const updated = await cashbackApi.updateStoreCashback(editingStore.storeId, editingStore);
      setStoresCashback((prev) =>
        prev.map((s) => (s.storeId === updated.storeId ? updated : s))
      );
      toast.success(`Updated cashback for ${updated.storeName} to ${updated.cashbackPercentage}%!`);
      setEditingStore(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update store cashback");
    } finally {
      setIsSavingStoreCashback(false);
    }
  };

  const handleToggleStoreStatus = async (store: StoreCashback) => {
    const updatedStatus = !store.isCashbackEnabled;
    try {
      const updated = await cashbackApi.updateStoreCashback(store.storeId, {
        ...store,
        isCashbackEnabled: updatedStatus
      });
      setStoresCashback((prev) =>
        prev.map((s) => (s.storeId === updated.storeId ? updated : s))
      );
      toast.success(`${store.storeName} cashback ${updatedStatus ? "Activated" : "Paused"}`);
    } catch (err: any) {
      toast.error("Failed to update store status");
    }
  };

  // Fetch real ledger from backend
  const fetchLedger = async (silent = false) => {
    setIsLoadingLedger(true);
    try {
      const data = await rewardApi.getAdminLedger({ size: 100 });
      if (data && data.length > 0) {
        const normalized: RewardLedgerItemDTO[] = data.map((item: any) => {
          const rawPoints = item.points != null ? item.points : (item.amount != null ? Number(item.amount) : 0);
          return {
            id: item.id,
            transactionId: item.transactionId || item.referenceId || item.id,
            customerId: item.customerId,
            customerName: item.customerName || (item.customerId ? "Registered Member" : "In-Store Diner"),
            points: rawPoints,
            type: (item.type === "CREDIT" ? "EARN" : item.type === "DEBIT" ? "REDEEM" : item.type) as any,
            description: item.description || "PINAK loyalty rewards entry",
            createdAt: item.createdAt,
            status: item.status || "POSTED"
          };
        });
        setLedgerItems(normalized);
        setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        if (!silent) {
          toast.success(`Loaded ${data.length} live reward ledger transactions`);
        }
      } else {
        setLedgerItems([]);
      }
    } catch (err) {
      console.warn("Could not fetch ledger:", err);
      if (!silent) {
        toast.error("Failed to sync reward ledger from backend");
      }
    } finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedger(true);
    fetchCashbackData();
    fetchCustomerAccounts();
    fetchWelcomeBonusSetting();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !pointsDelta) {
      toast.error("Please select a customer and enter points");
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await rewardApi.adjustReward({
        customerId: selectedCustomerId,
        pointsDelta: Number(pointsDelta),
        reason: adjustReason || "Admin manual adjustment"
      });

      toast.success(`Successfully adjusted ${pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta} points!`);
      setIsAdjustOpen(false);
      // Refresh ledger and customer accounts from database
      await Promise.all([
        fetchLedger(true),
        fetchCustomerAccounts()
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit points adjustment");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Export Ledger to CSV
  const handleExportLedger = () => {
    if (!ledgerItems.length) {
      toast.error("No ledger items to export");
      return;
    }
    const headers = ["ID", "Transaction / Ref", "Customer Name", "Type", "Points / Coins", "Description", "Date", "Status"];
    const rows = filteredLedgerItems.map(item => [
      `"${item.id}"`,
      `"${item.transactionId || ''}"`,
      `"${item.customerName || ''}"`,
      `"${item.type}"`,
      item.points,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${new Date(item.createdAt).toLocaleString()}"`,
      `"${item.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pinak-reward-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredLedgerItems.length} ledger transactions to CSV`);
  };

  // Live KPI Calculations from actual database customer accounts and ledger
  const totalWalletCoins = customerAccounts.reduce((acc, c) => acc + (Number(c.availableBalance) || 0), 0);
  const totalLifetimeEarned = customerAccounts.reduce((acc, c) => acc + (Number(c.lifetimeEarned) || 0), 0);
  const totalLifetimeRedeemed = customerAccounts.reduce((acc, c) => acc + (Number(c.lifetimeRedeemed) || 0), 0);

  const displayPointsIssued = totalLifetimeEarned >= 1000
    ? `${(totalLifetimeEarned / 1000).toFixed(1)}k Coins`
    : `${totalLifetimeEarned.toFixed(0)} Coins`;

  const displayPointsRedeemed = totalLifetimeRedeemed >= 1000
    ? `${(totalLifetimeRedeemed / 1000).toFixed(1)}k Coins`
    : `${totalLifetimeRedeemed.toFixed(0)} Coins`;

  const outstandingPointsValue = `₹${totalWalletCoins.toFixed(2)}`;
  const redemptionRate = (totalLifetimeEarned + totalLifetimeRedeemed) > 0
    ? `${((totalLifetimeRedeemed / (totalLifetimeEarned + totalLifetimeRedeemed)) * 100).toFixed(1)}%`
    : "0.0%";

    // Simulator Calculations
  const simulatedCoins = useMemo(() => {
    if (!cashbackSetting.enabled || simBillAmount < cashbackSetting.minTransactionAmount) return 0;
    const raw = Math.round((simBillAmount * cashbackSetting.defaultPercentage) / 100);
    return cashbackSetting.maxCashbackPerTransaction > 0 ? Math.min(raw, cashbackSetting.maxCashbackPerTransaction) : raw;
  }, [simBillAmount, cashbackSetting]);

  const isSimulatedCapped = useMemo(() => {
    if (!cashbackSetting.enabled || simBillAmount < cashbackSetting.minTransactionAmount) return false;
    const uncapped = (simBillAmount * cashbackSetting.defaultPercentage) / 100;
    return uncapped > cashbackSetting.maxCashbackPerTransaction;
  }, [simBillAmount, cashbackSetting]);

  // Filtered Stores
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    storesCashback.forEach(s => {
      if (s.cityName) set.add(s.cityName);
    });
    return Array.from(set);
  }, [storesCashback]);

  const filteredStores = useMemo(() => {
    return storesCashback.filter(s => {
      const matchesSearch = !storeSearch.trim() ||
        s.storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
        (s.cityName && s.cityName.toLowerCase().includes(storeSearch.toLowerCase()));

      const matchesStatus =
        storeStatusFilter === "all" ? true :
        storeStatusFilter === "active" ? s.isCashbackEnabled :
        !s.isCashbackEnabled;

      const matchesCity = storeCityFilter === "all" || s.cityName?.toLowerCase() === storeCityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [storesCashback, storeSearch, storeStatusFilter, storeCityFilter]);

  const totalStorePages = Math.max(1, Math.ceil(filteredStores.length / STORES_PER_PAGE));
  const paginatedStores = useMemo(() => {
    const start = (storePage - 1) * STORES_PER_PAGE;
    return filteredStores.slice(start, start + STORES_PER_PAGE);
  }, [filteredStores, storePage]);

  // Filtered Ledger Items
  const filteredLedgerItems = useMemo(() => {
    if (ledgerFilter === "ALL") return ledgerItems;
    return ledgerItems.filter(i => i.type === ledgerFilter);
  }, [ledgerItems, ledgerFilter]);

  // Customer table columns (Live Database Accounts)
  const customerColumns: Column<CustomerRewardAccountDTO>[] = [
    {
      header: "Customer",
      sortable: true,
      accessor: "customerName",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {(c.customerName || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white leading-tight">{c.customerName || "PINAK Member"}</p>
            <p className="text-[11px] text-slate-400 font-mono">{c.customerPhone || c.customerEmail || c.customerId.slice(0, 8)}</p>
          </div>
        </div>
      )
    },
    {
      header: "Loyalty Tier",
      sortable: true,
      accessor: "tier",
      render: (c) => {
        const seg = (c.tier || "BRONZE").toUpperCase();
        let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        if (seg === "PLATINUM" || seg === "VIP") badgeStyle = "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800";
        if (seg === "GOLD") badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
        if (seg === "SILVER") badgeStyle = "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200";

        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${badgeStyle}`}>
            {seg}
          </span>
        );
      }
    },
    {
      header: "Available Balance",
      sortable: true,
      accessor: "availableBalance",
      render: (c) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-pink-600 dark:text-pink-400">
            {Number(c.availableBalance).toFixed(2)} Coins
          </span>
          <span className="text-slate-400 text-[11px] ml-1.5">(₹{Number(c.availableBalance).toFixed(2)} val)</span>
        </div>
      )
    },
    {
      header: "Lifetime Earned",
      sortable: true,
      accessor: "lifetimeEarned",
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          +{Number(c.lifetimeEarned).toFixed(2)} Coins
        </span>
      )
    },
    {
      header: "Lifetime Redeemed",
      sortable: true,
      accessor: "lifetimeRedeemed",
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
          {Number(c.lifetimeRedeemed).toFixed(2)} Coins
        </span>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (c) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          {c.status || "ACTIVE"}
        </span>
      )
    },
    {
      header: "Actions",
      sortable: false,
      render: (c) => (
        <button
          onClick={() => {
            setSelectedCustomerId(c.customerId);
            setIsAdjustOpen(true);
          }}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 dark:text-pink-300 transition-colors cursor-pointer"
        >
          Adjust Points
        </button>
      )
    }
  ];

    // Ledger table columns
  const ledgerColumns: Column<RewardLedgerItemDTO>[] = [
    {
      header: "Transaction / ID",
      sortable: true,
      accessor: "id",
      render: (item) => {
        const refId = item.transactionId || item.id;
        return (
          <div className="flex items-center gap-1.5 group">
            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
              {refId}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(refId);
                toast.success(`Copied ${refId}`);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity"
              title="Copy Reference ID"
            >
              <Copy size={11} />
            </button>
          </div>
        );
      }
    },
    {
      header: "Customer",
      sortable: true,
      accessor: "customerName",
      render: (item) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200">{item.customerName || "Member"}</p>
          {item.customerId && (
            <p className="text-[10px] text-slate-400 font-mono">{item.customerId.slice(0, 8)}...</p>
          )}
        </div>
      )
    },
    {
      header: "Type",
      sortable: true,
      accessor: "type",
      render: (item) => {
        let badgeStyle = "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300";
        if (item.type === "EARN") badgeStyle = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
        if (item.type === "REDEEM") badgeStyle = "bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300";
        if (item.type === "ADJUSTMENT") badgeStyle = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
        if (item.type === "REVERSAL") badgeStyle = "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300";

        return (
          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] font-mono ${badgeStyle}`}>
            {item.type}
          </span>
        );
      }
    },
    {
      header: "Points Impact",
      sortable: true,
      accessor: "points",
      render: (item) => {
        const isPositive = item.points > 0;
        return (
          <div className="flex items-center gap-1 font-mono text-xs font-bold">
            {isPositive ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight size={13} />
                +{item.points} pts
              </span>
            ) : (
              <span className="text-pink-600 dark:text-pink-400 flex items-center">
                <ArrowDownLeft size={13} />
                {item.points} pts
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Description / Reason",
      sortable: false,
      accessor: "description",
      render: (item) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1 max-w-sm" title={item.description}>
          {item.description}
        </span>
      )
    },
    {
      header: "Timestamp",
      sortable: true,
      accessor: "createdAt",
      render: (item) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(item.createdAt).toLocaleDateString([], { month: "short", day: "2-digit" })}{" "}
          {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-pink-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold font-['Manrope'] tracking-tight">
              Rewards Economy & Loyalty Engine
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
              Super Admin Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Configure platform transaction cashback rules, manage restaurant outlet rates, review immutable reward ledgers, and supervise member loyalty balances.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsAddRuleOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Loyalty Rule</span>
          </button>
        </div>
      </div>

      {/* Rewards Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 text-xs gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LOYALTY ENGINE : ACTIVE</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
            Real-time points issuance, redemption auditing & wallet balance synchronization across member accounts
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Last synchronized: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastRefreshed}</span>
          </span>
          <button
            onClick={() => fetchLedger(false)}
            disabled={isLoadingLedger}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Live Ledger"
          >
            <RefreshCw size={14} className={isLoadingLedger ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Points Issued</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{displayPointsIssued}</p>
          <span className="text-xs text-emerald-600 font-bold">Direct UPI Rewards</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Points Redeemed</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{displayPointsRedeemed}</p>
          <span className="text-xs text-emerald-600 font-bold">In-store checkout burn</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance Value</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{outstandingPointsValue}</p>
          <span className="text-xs text-slate-400 font-medium">Customer wallet holdings</span>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Redemption Rate</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 font-['Manrope']">{redemptionRate}</p>
          <span className="text-xs text-emerald-600 font-bold">Reward burn efficiency</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("cashback")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "cashback"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Coins size={15} />
          <span>Transaction Cashback Settings</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
            Super Admin
          </span>
        </button>

        <button
          onClick={() => setActiveTab("welcome_bonus")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "welcome_bonus"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Gift size={15} />
          <span>First-Time Welcome Coins</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-950 font-black uppercase tracking-wider">
            Super Admin
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "ledger"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <History size={15} />
          <span>Live Reward Ledger & Audit Trail</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
            {ledgerItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("programs")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "programs"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles size={15} />
          <span>Loyalty Programs & Multipliers</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Super Admin Transaction Cashback Settings */}
      {/* ========================================================================= */}
      {activeTab === "cashback" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cashback Engine Status</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {cashbackSetting.enabled ? "ACTIVE" : "PAUSED"}
                </span>
                <span className={`w-3 h-3 rounded-full ${cashbackSetting.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              </div>
              <p className="text-[11px] text-slate-500">Live on all checkout & UPI payments</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Platform Rate</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                {cashbackSetting.defaultPercentage}% on Bill
              </div>
              <p className="text-[11px] text-slate-500">Credited directly to PINAK wallet</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Max Benefit Cap</span>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                ₹{cashbackSetting.maxCashbackPerTransaction}
              </div>
              <p className="text-[11px] text-slate-500">Maximum cap per single bill</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Configured Outlets</span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {storesCashback.length} Stores
              </div>
              <p className="text-[11px] text-slate-500">Managed with individual rate overrides</p>
            </div>
          </div>

          {/* Platform Settings Form Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                    Platform Transaction Cashback Policy
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    SUPER ADMIN EXCLUSIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set the global baseline cashback given to customers when they pay restaurant or retail bills on PINAK.
                </p>
              </div>

              {/* Master Enabled Toggle */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {cashbackSetting.enabled ? "Cashback Active" : "Cashback Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => setCashbackSetting({ ...cashbackSetting, enabled: !cashbackSetting.enabled })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    cashbackSetting.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      cashbackSetting.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveGlobalCashback} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Default Percentage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Default Cashback Rate (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={cashbackSetting.defaultPercentage}
                      onChange={(e) => setCashbackSetting({ ...cashbackSetting, defaultPercentage: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">%</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Baseline cashback % awarded to customer wallet</p>
                </div>

                {/* Max Cashback Cap */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Max Cashback Cap per Txn (₹) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={cashbackSetting.maxCashbackPerTransaction}
                      onChange={(e) => setCashbackSetting({ ...cashbackSetting, maxCashbackPerTransaction: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Protects wallet budgets on massive bills</p>
                </div>

                {/* Min Transaction Spend */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Minimum Bill Spend (₹) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={cashbackSetting.minTransactionAmount}
                      onChange={(e) => setCashbackSetting({ ...cashbackSetting, minTransactionAmount: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Minimum qualifying bill payment</p>
                </div>
              </div>

              {/* Reward Mode & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Cashback Reward Mode
                  </label>
                  <select
                    value={cashbackSetting.rewardMode}
                    onChange={(e) => setCashbackSetting({ ...cashbackSetting, rewardMode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="COINS">PINAK Coins (1 Coin = ₹1 redeemable at all outlets)</option>
                    <option value="WALLET">Direct Wallet Balance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Display Label for Customers
                  </label>
                  <input
                    type="text"
                    value={cashbackSetting.cashbackName || ""}
                    onChange={(e) => setCashbackSetting({ ...cashbackSetting, cashbackName: e.target.value })}
                    placeholder="e.g. PINAK Instant Transaction Cashback"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Interactive Live Cashback Simulator */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 tracking-wider">
                      Interactive Live Policy Simulator
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Test how this policy calculates coins on customer bills in real time
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Test Bill:</span>
                  {[500, 1000, 2000, 3500, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimBillAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        simBillAmount === amt
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50"
                      }`}
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                  <div className="relative ml-auto">
                    <input
                      type="number"
                      value={simBillAmount}
                      onChange={(e) => setSimBillAmount(Number(e.target.value) || 0)}
                      className="w-28 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-right pr-6"
                      placeholder="Custom"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated Reward</span>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{simulatedCoins} Coins
                    </p>
                    <span className="text-[10px] text-slate-500">₹{simulatedCoins} redeemable value</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Capping Status</span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                      {isSimulatedCapped ? (
                        <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <ShieldCheck size={14} /> Capped at ₹{cashbackSetting.maxCashbackPerTransaction}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Within Policy Cap
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] text-slate-500">Uncapped: ₹{Math.round((simBillAmount * cashbackSetting.defaultPercentage) / 100)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/50 dark:border-amber-900/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile App Display Pill</span>
                    <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200 mt-1 truncate">
                      "You will earn {cashbackSetting.defaultPercentage}% PINAK Coins"
                    </p>
                    <span className="text-[10px] text-slate-500">Live preview on customer checkout</span>
                  </div>
                </div>
              </div>

              {/* Apply to All Stores Checkbox */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="applyToAllStores"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="applyToAllStores" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <strong className="text-amber-950 dark:text-amber-200 font-bold block mb-0.5">
                    Sync to All Stores ({storesCashback.length} Outlets)
                  </strong>
                  Check this box if you want this {cashbackSetting.defaultPercentage}% cashback rate, ₹{cashbackSetting.maxCashbackPerTransaction} cap, and ₹{cashbackSetting.minTransactionAmount} min spend to overwrite all store records immediately.
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingCashback}
                  className="btn-gradient px-6 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSavingCashback ? "Saving Policy..." : "Save Platform Cashback Policy"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Stores Cashback Oversight Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                  Individual Store Cashback Configurations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stores inherit the platform default rate, but Super Admin can customize or override cashback for specific outlets.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchCashbackData}
                disabled={isLoadingCashback}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw size={13} className={isLoadingCashback ? "animate-spin" : ""} />
                <span>Refresh Stores</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => {
                      setStoreSearch(e.target.value);
                      setStorePage(1);
                    }}
                    placeholder="Search outlet or city..."
                    className="w-56 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                {/* Status Chips */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-bold">
                  {(["all", "active", "disabled"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStoreStatusFilter(s);
                        setStorePage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        storeStatusFilter === s
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* City Filter */}
                {availableCities.length > 0 && (
                  <select
                    value={storeCityFilter}
                    onChange={(e) => {
                      setStoreCityFilter(e.target.value);
                      setStorePage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="all">All Cities</option>
                    {availableCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                Showing <strong className="text-slate-700 dark:text-slate-200">{filteredStores.length}</strong> outlets
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Store Name & City</th>
                    <th className="py-3 px-4">Cashback Rate</th>
                    <th className="py-3 px-4">Max Cap (₹)</th>
                    <th className="py-3 px-4">Min Spend (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {paginatedStores.map((s) => (
                    <tr key={s.storeId} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {s.storeName}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                          <MapPin size={10} />
                          <span>{s.cityName || "Nagpur"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/50">
                          🪙 {s.cashbackPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ₹{s.maxCashbackAmount}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ₹{s.minTransactionForCashback}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStoreStatus(s)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            s.isCashbackEnabled
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                          title="Click to toggle status"
                        >
                          {s.isCashbackEnabled ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingStore(s)}
                          className="px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 dark:text-purple-300 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={11} />
                          <span>Edit Rate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedStores.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        {storeSearch || storeStatusFilter !== "all" || storeCityFilter !== "all"
                          ? "No stores match the current filters."
                          : "No stores found in database. Create a store first to configure its cashback rate."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalStorePages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Page <strong className="text-slate-700 dark:text-slate-300">{storePage}</strong> of {totalStorePages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={storePage <= 1}
                    onClick={() => setStorePage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={storePage >= totalStorePages}
                    onClick={() => setStorePage(p => Math.min(totalStorePages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: Super Admin First-Time User Welcome Coins (Instant Signup Bonus) */}
      {/* ========================================================================= */}
      {activeTab === "welcome_bonus" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Welcome Bonus Engine</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {welcomeBonusSetting.enabled ? "ACTIVE" : "PAUSED"}
                </span>
                <span className={`w-3 h-3 rounded-full ${welcomeBonusSetting.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              </div>
              <p className="text-[11px] text-slate-500">Credited on first-time OTP verification</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Instant Signup Coins</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                🪙 {welcomeBonusSetting.coins} Coins
              </div>
              <p className="text-[11px] text-slate-500">Credited to customer PostgreSQL wallet</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rupee Value Equivalent</span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{welcomeBonusSetting.coins}
              </div>
              <p className="text-[11px] text-slate-500">Instant spendable balance at checkouts</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Anti-Duplicate Protection</span>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                Idempotent
              </div>
              <p className="text-[11px] text-slate-500">First-time signups only (Returning users blocked)</p>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-['Manrope']">
                    First-Time User Welcome Coins Policy
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    SUPER ADMIN EXCLUSIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the instant PINAK coins credited to new mobile customers upon their first OTP verification.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {welcomeBonusSetting.enabled ? "Bonus Enabled" : "Bonus Paused"}
                </span>
                <button
                  type="button"
                  onClick={() => setWelcomeBonusSetting((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    welcomeBonusSetting.enabled ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      welcomeBonusSetting.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveWelcomeBonus} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Instant Welcome Coins (₹ Value)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      🪙
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={welcomeBonusSetting.coins}
                      onChange={(e) => setWelcomeBonusSetting((prev) => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Credited immediately to the customer's wallet on their first login.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Welcome Coupon Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={welcomeBonusSetting.couponCode}
                      onChange={(e) => setWelcomeBonusSetting((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                      placeholder="WELCOME100"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold uppercase font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Identifies this first-time bonus in ledger and vouchers.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Auditable Description
                  </label>
                  <input
                    type="text"
                    value={welcomeBonusSetting.description}
                    onChange={(e) => setWelcomeBonusSetting((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Instant Welcome Bonus for first-time mobile signup"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Stored in PostgreSQL `reward_ledger_entries` table.
                  </p>
                </div>
              </div>

              {/* Security & Idempotency Guarantee Callout */}
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-purple-950 dark:text-purple-200">
                    Fraud Prevention & First-Time Isolation Guarantee
                  </h4>
                  <p className="text-purple-800 dark:text-purple-300 leading-relaxed text-[11px]">
                    The backend strictly validates whether a phone number is registering for the first time. 
                    When a returning customer requests OTP and logs in, the welcome bonus is automatically bypassed (0 duplicate coins credited).
                    All credits are written with an immutable reference ID (<code className="font-mono bg-purple-100 dark:bg-purple-900 px-1 py-0.2 rounded">WELCOME-BONUS-{"{userId}"}</code>) ensuring no customer can ever claim it twice.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingWelcomeBonus}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-98 transition cursor-pointer"
                >
                  {isSavingWelcomeBonus ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving Policy...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Welcome Bonus Setting</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Live Reward Ledger & Audit Trail */}
      {/* ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Bar & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              {(["ALL", "EARN", "REDEEM", "ADJUSTMENT"] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLedgerFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    ledgerFilter === f
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {f === "ALL" ? `All (${ledgerItems.length})` : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportLedger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Download CSV"
              >
                <Download size={13} />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => fetchLedger(false)}
                disabled={isLoadingLedger}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw size={13} className={isLoadingLedger ? "animate-spin" : ""} />
                <span>Sync Ledger</span>
              </button>
            </div>
          </div>

          <AdvancedTable
            title="Real-Time Reward Points Ledger"
            subtitle={`${filteredLedgerItems.length} transactions recorded with full auditability`}
            columns={ledgerColumns}
            data={filteredLedgerItems}
            keyExtractor={(item) => item.id}
            searchPlaceholder="Search transaction ref, customer, or reason..."
            searchFilter={(item, q) =>
              item.id.toLowerCase().includes(q) ||
              (item.transactionId && item.transactionId.toLowerCase().includes(q)) ||
              (item.customerName && item.customerName.toLowerCase().includes(q)) ||
              item.type.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
            }
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Programs & Customer Wallets */}
      {/* ========================================================================= */}
      {activeTab === "programs" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Rules List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-['Manrope']">
              Active Reward Programs & Multipliers
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rewardRules && rewardRules.length > 0 ? (
                rewardRules.map((rule) => (
                  <div key={rule.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 mt-0.5">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{rule.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="font-bold text-pink-600 dark:text-pink-400">
                            {rule.earnPointsPerHundred} pts per ₹100 spent
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">{rule.categoryFilter}</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="success" className="self-start sm:self-auto">
                      <CheckCircle2 size={12} />
                      {rule.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No custom loyalty campaign rules added yet. Click &quot;New Loyalty Rule&quot; to configure additional category multipliers.
                </div>
              )}
            </div>
          </div>

          {/* Customer Wallet Balances Table */}
          <AdvancedTable
            title="Customer Loyalty Wallets"
            subtitle={`${customerAccounts.length} registered customer accounts synchronized from database`}
            columns={customerColumns}
            data={customerAccounts}
            keyExtractor={(c) => c.id || c.customerId}
            searchPlaceholder="Search customer name, phone, email, or tier..."
            searchFilter={(c, q) =>
              (c.customerName && c.customerName.toLowerCase().includes(q)) ||
              (c.customerPhone && c.customerPhone.includes(q)) ||
              (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
              (c.tier && c.tier.toLowerCase().includes(q)) ||
              c.customerId.includes(q)
            }
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Edit Single Store Cashback Modal */}
      {/* ========================================================================= */}
      {editingStore && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setEditingStore(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Store Cashback Override</h3>
                </div>
                <button
                  onClick={() => setEditingStore(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveStoreCashback} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
                <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Target Outlet</span>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {editingStore.storeName}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Custom rates configured here override the platform default policy for this specific outlet.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Cashback Rate (%) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editingStore.cashbackPercentage}
                      onChange={(e) => setEditingStore({ ...editingStore, cashbackPercentage: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Max Benefit Cap (₹) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={editingStore.maxCashbackAmount}
                      onChange={(e) => setEditingStore({ ...editingStore, maxCashbackAmount: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Minimum Qualifying Spend (₹) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={editingStore.minTransactionForCashback}
                      onChange={(e) => setEditingStore({ ...editingStore, minTransactionForCashback: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 font-bold text-slate-400 text-xs">₹</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Enable Cashback for this Store</span>
                  <input
                    type="checkbox"
                    checked={editingStore.isCashbackEnabled}
                    onChange={(e) => setEditingStore({ ...editingStore, isCashbackEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStore(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStoreCashback}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={13} />
                    <span>{isSavingStoreCashback ? "Saving..." : "Save Store Cashback"}</span>
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Manual Point Adjustment Modal with Live Projection */}
      {/* ========================================================================= */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAdjustOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Manual Points Adjustment</h3>
                </div>
                <button
                  onClick={() => setIsAdjustOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 text-purple-800 dark:text-purple-300">
                  <p className="font-medium text-xs leading-relaxed">
                    Points adjustments are permanently recorded to the customer's loyalty ledger with complete audit traceability. Positive values credit points, while negative values debit.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Target Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">Select a customer...</option>
                    {customerAccounts.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.customerName || "Member"} ({c.customerPhone || c.customerEmail || c.customerId.slice(0, 8)}) — Current: {c.availableBalance} Coins
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Points Delta (+ for credit, - for debit)
                  </label>
                  <input
                    type="number"
                    value={pointsDelta}
                    onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                    required
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Value equivalent: ₹{(Math.abs(pointsDelta) * 0.25).toFixed(2)} INR
                  </p>
                </div>

                {/* Quick Justification Chips */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Adjustment Justification</label>
                  <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                    {[
                      "VIP Member Goodwill Credit",
                      "Order Inconvenience Compensation",
                      "Payment Dispute Resolution",
                      "Campaign Multiplier Bonus"
                    ].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setAdjustReason(r)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                          adjustReason === r
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                    placeholder="Enter justification..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdjustOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdjust || !selectedCustomerId || pointsDelta === 0}
                    className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingAdjust ? "Applying..." : "Apply Adjustment"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Add Rule Right Slide-Over Drawer */}
      {/* ========================================================================= */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddRuleOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">New Loyalty Program</h3>
                </div>
                <button
                  onClick={() => setIsAddRuleOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rule Name</label>
                  <input
                    type="text"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="e.g. Weekend Dining Booster"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Points Per ₹100</label>
                    <input
                      type="number"
                      value={earnRate}
                      onChange={(e) => setEarnRate(parseInt(e.target.value) || 1)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Category Scope</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    >
                      <option>All categories</option>
                      <option>Food & Dining</option>
                      <option>Beauty & Wellness</option>
                      <option>Gym & Fitness</option>
                      <option>Retail & Shopping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Customer explanation for the app banner..."
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onAddRule({
                      name: ruleName,
                      earnPointsPerHundred: earnRate,
                      categoryFilter: category,
                      description
                    });
                    setIsAddRuleOpen(false);
                    toast.success(`Loyalty rule "${ruleName}" created successfully!`);
                  }}
                  disabled={!ruleName}
                  className="btn-gradient px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Create Program
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
