import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Download,
  Sparkles,
  Activity,
  TrendingUp,
  RefreshCw,
  Server,
  ShieldCheck,
  UserCheck,
  UserX,
  Coins,
  ChevronRight,
  X,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  MapPin,
  CreditCard,
  UtensilsCrossed,
  Tag,
  SlidersHorizontal,
  UserPlus,
  Receipt,
  Percent,
  Copy,
  ExternalLink,
  DollarSign,
  Award
} from "lucide-react";
import { Customer } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import {
  customerApi,
  CustomerDirectoryItem,
  CustomerStats,
  CustomerDetailResponse,
  CreateCustomerPayload
} from "../../api/customerApi";
import { toast } from "sonner";

interface CustomerInsightsProps {
  customers?: Customer[];
}

export const CustomerInsights: React.FC<CustomerInsightsProps> = () => {
  // Directory & Stats state
  const [customerList, setCustomerList] = useState<CustomerDirectoryItem[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [segmentFilter, setSegmentFilter] = useState<string>("ALL");
  const [cityFilter, setCityFilter] = useState<string>("ALL");

  // Selected Customer & Dossier Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [drawerActiveTab, setDrawerActiveTab] = useState<"overview" | "rewards" | "bookings" | "transactions" | "moderation">("overview");

  // Manual Points Adjustment State
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [pointsDelta, setPointsDelta] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>("Promotional VIP Loyalty Credit");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Status Moderation State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string>("");
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<CreateCustomerPayload>({
    name: "",
    phone: "",
    email: "",
    city: "Nagpur",
    state: "Maharashtra",
    district: "Nagpur",
    pincode: "440010",
    address: "",
    gender: "OTHER",
    birthday: "",
    referralCode: "",
    initialBonusCoins: 100
  });

  // Fetch Live Directory & Platform Stats
  const fetchData = async (silent = false) => {
    setIsLoading(true);
    try {
      const [dirRes, statsRes] = await Promise.all([
        customerApi.getCustomers({
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          segment: segmentFilter !== "ALL" ? segmentFilter : undefined,
          city: cityFilter !== "ALL" ? cityFilter : undefined,
          size: 100
        }),
        customerApi.getStats()
      ]);

      setCustomerList(dirRes.customers || []);
      if (statsRes) {
        setStats(statsRes);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (!silent) {
        toast.success(`Synchronized ${dirRes.customers.length} verified customer records from PostgreSQL`);
      }
    } catch (err: any) {
      console.warn("Error synchronizing customer directory:", err);
      if (!silent) {
        toast.error("Failed to synchronize customer records from backend");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [statusFilter, segmentFilter, cityFilter]);

  // Handle Search on Submit or Debounced
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(false);
  };

  // Fetch Full Customer Details when Customer is Selected
  useEffect(() => {
    if (selectedCustomerId) {
      setIsLoadingDetails(true);
      setDrawerActiveTab("overview");
      setShowAdjustPoints(false);
      setShowSuspendConfirm(false);
      setSuspensionReason("");

      customerApi.getDetails(selectedCustomerId)
        .then((data) => {
          setCustomerDetails(data);
        })
        .catch(() => {
          toast.error("Failed to load customer dossier details");
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else {
      setCustomerDetails(null);
    }
  }, [selectedCustomerId]);

  // Extract Unique Cities for Filter Rail
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    customerList.forEach((c) => {
      if (c.primaryCity) cities.add(c.primaryCity);
      else if (c.city) cities.add(c.city);
    });
    return Array.from(cities);
  }, [customerList]);

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Account Status Update Handler
  const handleUpdateStatus = async (targetStatus: "ACTIVE" | "SUSPENDED", reason?: string) => {
    if (!selectedCustomerId) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await customerApi.updateStatus(selectedCustomerId, targetStatus, reason);
      // Update in local list
      setCustomerList((prev) =>
        prev.map((c) => (c.id === selectedCustomerId ? { ...c, status: targetStatus } : c))
      );
      // Update in active details
      if (customerDetails) {
        setCustomerDetails({
          ...customerDetails,
          profile: { ...customerDetails.profile, status: targetStatus }
        });
      }
      toast.success(`Customer account successfully ${targetStatus === "ACTIVE" ? "reactivated" : "suspended"}`);
      setShowSuspendConfirm(false);
      setSuspensionReason("");
      // Refresh stats
      customerApi.getStats().then((s) => s && setStats(s));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to update account status to ${targetStatus}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Adjust Loyalty Reward Points Handler
  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !pointsDelta) return;
    setIsSubmittingAdjust(true);
    try {
      const updatedWallet = await customerApi.adjustPoints(
        selectedCustomerId,
        Number(pointsDelta),
        adjustReason || "Admin manual points adjustment"
      );
      // Update in details
      if (customerDetails) {
        setCustomerDetails({
          ...customerDetails,
          rewardWallet: updatedWallet,
          profile: {
            ...customerDetails.profile,
            rewardsBalance: updatedWallet.pointsBalance,
            tier: updatedWallet.tier
          }
        });
      }
      // Update in local list
      setCustomerList((prev) =>
        prev.map((c) =>
          c.id === selectedCustomerId
            ? { ...c, rewardsBalance: updatedWallet.pointsBalance, tier: updatedWallet.tier }
            : c
        )
      );
      toast.success(
        `Successfully adjusted ${pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta} PINAK Coins for ${customerDetails?.profile.name || "customer"}`
      );
      setShowAdjustPoints(false);
      // Refresh stats
      customerApi.getStats().then((s) => s && setStats(s));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust reward points");
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Add New Customer Submit Handler
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      toast.error("Customer Full Name and Mobile Phone are required");
      return;
    }
    setIsSubmittingAdd(true);
    try {
      const created = await customerApi.createCustomer(newCustomerForm);
      setCustomerList((prev) => [created, ...prev]);
      toast.success(`Customer ${created.name} registered successfully!`);
      setShowAddModal(false);
      setNewCustomerForm({
        name: "",
        phone: "",
        email: "",
        city: "Nagpur",
        state: "Maharashtra",
        district: "Nagpur",
        pincode: "440010",
        address: "",
        gender: "OTHER",
        birthday: "",
        referralCode: "",
        initialBonusCoins: 100
      });
      // Refresh stats
      customerApi.getStats().then((s) => s && setStats(s));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register customer account");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Export Filtered Customers to CSV
  const handleExportCsv = () => {
    const headers = [
      "Customer UID",
      "Full Name",
      "Phone",
      "Email",
      "Primary City",
      "State",
      "Pincode",
      "Gender",
      "Account Status",
      "Audience Segment",
      "Loyalty Tier",
      "PINAK Coins Balance",
      "Cash Equivalent (INR)",
      "Store Visits",
      "Lifetime Spend (INR)",
      "Referral Code",
      "Registered Date"
    ];

    const rows = customerList.map((c) => [
      `"${c.id}"`,
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${c.phone || ""}"`,
      `"${c.email || ""}"`,
      `"${c.primaryCity || c.city || ""}"`,
      `"${c.state || ""}"`,
      `"${c.pincode || ""}"`,
      `"${c.gender || ""}"`,
      `"${c.status}"`,
      `"${c.segment}"`,
      `"${c.tier}"`,
      `"${c.rewardsBalance}"`,
      `"${(c.rewardsBalance * 0.10).toFixed(2)}"`,
      `"${c.visits}"`,
      `"${Number(c.totalSpend || 0).toFixed(2)}"`,
      `"${c.referralCode || ""}"`,
      `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PINAK_Verified_Customers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${customerList.length} verified customer records to CSV!`);
  };

  // Table Columns Definition
  const columns: Column<CustomerDirectoryItem>[] = [
    {
      header: "Customer Profile",
      sortable: true,
      accessor: "name",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800">
            {c.initials || "CU"}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white leading-tight truncate flex items-center gap-1.5">
              <span>{c.name}</span>
              {c.profileCompleted && (
                <span title="Profile 100% Completed">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 inline" />
                </span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{c.phone}</p>
          </div>
        </div>
      )
    },
    {
      header: "City / State",
      sortable: true,
      accessor: "city",
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
            {c.primaryCity || c.city || "Nagpur"}, {c.state ? c.state.substring(0, 2).toUpperCase() : "MH"}
          </span>
        </div>
      )
    },
    {
      header: "Status",
      sortable: true,
      accessor: "status",
      render: (c) => {
        const isSuspended = c.status === "SUSPENDED" || c.status === "BLOCKED";
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isSuspended
                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-500" : "bg-emerald-500"}`} />
            {c.status || "ACTIVE"}
          </span>
        );
      }
    },
    {
      header: "Store Visits",
      sortable: true,
      accessor: "visits",
      render: (c) => (
        <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white font-mono">
          <UtensilsCrossed size={12} className="text-purple-500" />
          <span>{c.visits} visits</span>
        </div>
      )
    },
    {
      header: "Lifetime Spend",
      sortable: true,
      accessor: "totalSpend",
      render: (c) => (
        <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          ₹{Number(c.totalSpend || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      header: "Reward Coins",
      sortable: true,
      accessor: "rewardsBalance",
      render: (c) => (
        <div className="font-mono text-xs">
          <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-extrabold">
            <Coins size={12} />
            <span>{Number(c.rewardsBalance || 0).toLocaleString()}</span>
          </div>
          <span className="text-slate-400 text-[10px]">
            ≈ ₹{(Number(c.rewardsBalance || 0) * 0.10).toFixed(0)} cash
          </span>
        </div>
      )
    },
    {
      header: "Segment",
      sortable: true,
      accessor: "segment",
      render: (c) => {
        const isPower = c.segment === "Power user";
        const isNew = c.segment === "New";
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isPower
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                : isNew
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
            }`}
          >
            {c.segment}
          </span>
        );
      }
    },
    {
      header: "Actions",
      sortable: false,
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCustomerId(c.id);
          }}
          className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:text-purple-300 transition-colors border border-purple-200/80 dark:border-purple-800 flex items-center gap-1 shadow-2xs"
        >
          <span>Manage</span>
          <ChevronRight size={13} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
              Customer Directory & User Management
            </h2>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live PostgreSQL
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Institutional platform member registry, live PINAK Coins balance oversight, booking history & account governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus size={14} />
            <span>+ Add Customer</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={customerList.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs disabled:opacity-50"
            title="Export directory as CSV"
          >
            <Download size={14} />
            <span>Export (.CSV)</span>
          </button>
          <button
            onClick={() => fetchData(false)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-purple-600" : ""} />
            <span>{isLoading ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Synchronized Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 text-xs gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
            <Server size={12} />
            <span>CUSTOMER DATABASE : SYNCHRONIZED</span>
          </div>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-600 dark:text-slate-400 font-medium hidden sm:inline">
            Directly connected to PostgreSQL <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">users</code> & <code className="font-mono text-pink-600 dark:text-pink-400 font-bold">reward_accounts</code> tables
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Last synchronized: <span className="font-semibold text-slate-700 dark:text-slate-300">{lastRefreshed}</span>
        </div>
      </div>

      {/* Production Institutional Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Members</span>
            <Users size={14} className="text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
            {stats ? stats.totalCustomers.toLocaleString() : customerList.length}
          </p>
          <p className="text-[11px] text-slate-400">Registered platform users</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active Accounts</span>
            <CheckCircle2 size={14} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-['Manrope']">
            {stats ? stats.activeCustomers.toLocaleString() : customerList.filter((c) => c.status === "ACTIVE").length}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            {stats ? Math.round((stats.activeCustomers / (stats.totalCustomers || 1)) * 100) : 100}% in good standing
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Power VIP Users</span>
            <Award size={14} className="text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-['Manrope']">
            {stats ? stats.powerUsers.toLocaleString() : customerList.filter((c) => c.segment === "Power user").length}
          </p>
          <p className="text-[11px] text-purple-600 font-medium">≥ 5 visits or ₹2K spend</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Suspended</span>
            <AlertCircle size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-['Manrope']">
            {stats ? stats.suspendedCustomers.toLocaleString() : customerList.filter((c) => c.status === "SUSPENDED").length}
          </p>
          <p className="text-[11px] text-slate-400">Policy review or locked</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Platform Spend</span>
            <DollarSign size={14} className="text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
            ₹{stats ? Math.round(stats.totalPlatformSpend).toLocaleString("en-IN") : "0"}
          </p>
          <p className="text-[11px] text-slate-400">Total customer volume</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Coins In Market</span>
            <Coins size={14} className="text-pink-600" />
          </div>
          <p className="text-2xl font-extrabold text-pink-600 dark:text-pink-400 font-['Manrope']">
            {stats ? stats.totalCoinsCirculating.toLocaleString() : "0"}
          </p>
          <p className="text-[11px] text-pink-600 font-medium">
            ≈ ₹{stats ? (stats.totalCoinsCirculating * 0.10).toFixed(0) : "0"} reserve
          </p>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone (+91), email, city or referral code..."
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setTimeout(() => fetchData(true), 50);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="SUSPENDED">Suspended Accounts</option>
            </select>

            {/* Segment Dropdown */}
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Segments</option>
              <option value="POWER_USER">Power Users (VIP)</option>
              <option value="REGULAR">Regular Shoppers</option>
              <option value="NEW">New Accounts</option>
            </select>

            {/* City Dropdown */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Reset Filters button */}
            {(searchQuery || statusFilter !== "ALL" || segmentFilter !== "ALL" || cityFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setSegmentFilter("ALL");
                  setCityFilter("ALL");
                  setTimeout(() => fetchData(true), 50);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Customer Directory Table */}
      <AdvancedTable
        title="Verified Platform Customers"
        subtitle={`${customerList.length} registered members loaded directly from database`}
        columns={columns}
        data={customerList}
        keyExtractor={(c) => c.id}
        onRowClick={(c: CustomerDirectoryItem) => setSelectedCustomerId(c.id)}
        searchPlaceholder="Type to filter displayed rows..."
      />

      {/* ========================================================================= */}
      {/* Customer Profile & Dossier Slide-Over Drawer */}
      {/* ========================================================================= */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <aside className="w-screen max-w-2xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-purple-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Customer Dossier & Oversight
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      UID: {selectedCustomerId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              {isLoadingDetails ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
                  <RefreshCw size={28} className="animate-spin text-purple-600" />
                  <p className="text-xs font-semibold text-slate-500">Loading customer account dossier...</p>
                </div>
              ) : customerDetails ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Top Customer Hero Banner */}
                  <div className="p-6 bg-gradient-to-r from-purple-50/50 via-slate-50/50 to-pink-50/50 dark:from-purple-950/20 dark:via-slate-900/40 dark:to-pink-950/20 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md">
                          {customerDetails.profile.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                              {customerDetails.profile.name}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                customerDetails.profile.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {customerDetails.profile.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {customerDetails.profile.phone} • {customerDetails.profile.email}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Tier: {customerDetails.rewardWallet.tier}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Segment: {customerDetails.profile.segment}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                              Multiplier: {customerDetails.rewardWallet.multiplier}x
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
                    {[
                      { id: "overview", label: "Overview & Profile", icon: Users },
                      { id: "rewards", label: "Rewards Wallet", icon: Coins },
                      { id: "bookings", label: `Bookings (${customerDetails.recentBookings.length})`, icon: Calendar },
                      { id: "transactions", label: `Transactions (${customerDetails.recentTransactions.length})`, icon: Receipt },
                      { id: "moderation", label: "Moderation", icon: ShieldCheck }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = drawerActiveTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setDrawerActiveTab(tab.id as any)}
                          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                            isActive
                              ? "border-purple-600 text-purple-600 dark:text-purple-400"
                              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                          }`}
                        >
                          <Icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Scrollable Tab Views */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ========================================================= */}
                    {/* TAB 1: OVERVIEW & PROFILE */}
                    {/* ========================================================= */}
                    {drawerActiveTab === "overview" && (
                      <div className="space-y-5">
                        {/* Summary Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-500">Verified Visits</span>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                              {customerDetails.profile.visits} visits
                            </p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-500">Lifetime Volume</span>
                            <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                              ₹{Number(customerDetails.profile.totalSpend || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[11px] font-semibold text-slate-500">PINAK Coins</span>
                            <p className="text-lg font-extrabold text-pink-600 dark:text-pink-400 font-mono mt-0.5">
                              {customerDetails.rewardWallet.pointsBalance.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Contact Information & Demographics */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Identity & Contact Dossier
                          </h5>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <Phone size={14} /> Mobile Phone
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {customerDetails.profile.phone}
                              </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <Mail size={14} /> Email Address
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {customerDetails.profile.email}
                              </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <MapPin size={14} /> Primary Residence
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white text-right max-w-xs">
                                {customerDetails.profile.address || "Main City Road"},{" "}
                                {customerDetails.profile.primaryCity || customerDetails.profile.city},{" "}
                                {customerDetails.profile.state} - {customerDetails.profile.pincode}
                              </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <Calendar size={14} /> Birthday / Age
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {customerDetails.profile.birthday || "Not specified"} (
                                {customerDetails.profile.gender || "Gender not set"})
                              </span>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <Tag size={14} /> Customer Referral Code
                              </span>
                              <div className="flex items-center gap-2 font-mono font-bold text-purple-600">
                                <span>{customerDetails.profile.referralCode || "N/A"}</span>
                                {customerDetails.profile.referralCode && (
                                  <button
                                    onClick={() => copyToClipboard(customerDetails.profile.referralCode!, "Referral Code")}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <Copy size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="py-2.5 flex items-center justify-between">
                              <span className="flex items-center gap-2 text-slate-500">
                                <Calendar size={14} /> Member Registration Date
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {customerDetails.profile.createdAt
                                  ? new Date(customerDetails.profile.createdAt).toLocaleString("en-IN", {
                                      dateStyle: "medium",
                                      timeStyle: "short"
                                    })
                                  : "Recently Registered"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: REWARDS WALLET & ADJUSTMENT */}
                    {/* ========================================================= */}
                    {drawerActiveTab === "rewards" && (
                      <div className="space-y-5">
                        {/* Wallet Status Card */}
                        <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/5 border border-pink-200/80 dark:border-pink-900/50 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins size={18} className="text-pink-600 dark:text-pink-400" />
                              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                PINAK Coins Ledger Account
                              </span>
                            </div>
                            <Badge variant="outline" className="border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950/40">
                              Tier {customerDetails.rewardWallet.tier}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-slate-500">Spendable Coins</span>
                              <p className="text-lg font-extrabold text-pink-600 dark:text-pink-400 font-mono mt-0.5">
                                {customerDetails.rewardWallet.pointsBalance.toLocaleString()}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                ≈ ₹{customerDetails.rewardWallet.cashEquivalentInr.toFixed(0)} cash
                              </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-slate-500">Lifetime Earned</span>
                              <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                                {customerDetails.rewardWallet.lifetimeEarned.toLocaleString()}
                              </p>
                              <span className="text-[10px] text-emerald-600">Total credited</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-slate-500">Lifetime Redeemed</span>
                              <p className="text-lg font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                                {customerDetails.rewardWallet.lifetimeRedeemed.toLocaleString()}
                              </p>
                              <span className="text-[10px] text-slate-400">Used at billing</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                              <span className="text-[10px] font-semibold text-slate-500">Coin Multiplier</span>
                              <p className="text-lg font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                                {customerDetails.rewardWallet.multiplier}x
                              </p>
                              <span className="text-[10px] text-purple-600">Active boost</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowAdjustPoints(!showAdjustPoints)}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
                          >
                            <Coins size={14} />
                            <span>{showAdjustPoints ? "Cancel Point Adjustment" : "Perform Manual Points Adjustment"}</span>
                          </button>

                          {/* Manual Point Adjustment Sub-Form */}
                          {showAdjustPoints && (
                            <form
                              onSubmit={handleAdjustPointsSubmit}
                              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 animate-in fade-in"
                            >
                              <div>
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Points Delta (+ to credit coins, - to debit coins)
                                </label>
                                <input
                                  type="number"
                                  value={pointsDelta}
                                  onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white font-mono"
                                  required
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  {pointsDelta > 0
                                    ? `Credits ${pointsDelta} coins (approx ₹${(pointsDelta * 0.10).toFixed(2)}) to customer`
                                    : `Debits ${Math.abs(pointsDelta)} coins from customer balance`}
                                </span>
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  Administrative Reason for Adjustment
                                </label>
                                <input
                                  type="text"
                                  value={adjustReason}
                                  onChange={(e) => setAdjustReason(e.target.value)}
                                  placeholder="e.g. Compensation for payment gateway timeout"
                                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                  required
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isSubmittingAdjust || pointsDelta === 0}
                                className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {isSubmittingAdjust ? "Applying Adjustment to DB..." : "Submit Points Adjustment"}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: TABLE BOOKINGS */}
                    {/* ========================================================= */}
                    {drawerActiveTab === "bookings" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Table Reservations ({customerDetails.recentBookings.length})
                          </h5>
                        </div>

                        {customerDetails.recentBookings.length === 0 ? (
                          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Calendar size={24} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Reservations on Record</p>
                            <p className="text-[11px] text-slate-400 mt-1">This customer has not booked tables online yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {customerDetails.recentBookings.map((b) => (
                              <div
                                key={b.id}
                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                    {b.bookingRef}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      b.status === "COMPLETED"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {b.storeName}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <span>
                                    {b.bookingDate} at {b.slotTime} ({b.guests} guests)
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    Paid: ₹{Number(b.totalPaid || 0).toFixed(2)}
                                  </span>
                                </div>
                                {b.verificationCode && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    OTP Code: <strong className="text-purple-600">{b.verificationCode}</strong>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 4: STORE TRANSACTIONS */}
                    {/* ========================================================= */}
                    {drawerActiveTab === "transactions" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Billing Payments & Checkouts ({customerDetails.recentTransactions.length})
                          </h5>
                        </div>

                        {customerDetails.recentTransactions.length === 0 ? (
                          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Receipt size={24} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Transactions on Record</p>
                            <p className="text-[11px] text-slate-400 mt-1">This member has not made payments through PINAK yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {customerDetails.recentTransactions.map((t) => (
                              <div
                                key={t.id}
                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    {t.transactionReference}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      t.status === "SUCCESS"
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                    }`}
                                  >
                                    {t.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {t.storeName}
                                  </p>
                                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                    ₹{Number(t.payableAmount || t.amount).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                                  <span>
                                    {t.paymentMethod} • {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}
                                  </span>
                                  <span className="text-pink-600 font-bold font-mono text-[10px]">
                                    +{t.pointsAwarded} Coins Earned
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 5: ACCOUNT MODERATION & GOVERNANCE */}
                    {/* ========================================================= */}
                    {drawerActiveTab === "moderation" && (
                      <div className="space-y-5">
                        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Account Security & Access State
                          </h5>

                          {customerDetails.profile.status === "SUSPENDED" ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-3">
                              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                                <CheckCircle2 size={16} />
                                <span>Account is Currently Suspended</span>
                              </div>
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                Customer is currently blocked from signing in, viewing deals, and redeeming voucher QR codes. Reactivating will restore full platform permissions immediately.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus("ACTIVE", "Admin restored account")}
                                disabled={isUpdatingStatus}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                <UserCheck size={14} />
                                <span>{isUpdatingStatus ? "Restoring Access..." : "Reactivate Customer Account"}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-3">
                              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                                <AlertCircle size={16} />
                                <span>Account in Good Standing</span>
                              </div>
                              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                If fraudulent activity, suspicious coupon scans, or terms violations occur, you can temporarily suspend this customer's account.
                              </p>

                              {showSuspendConfirm ? (
                                <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    Reason for Account Suspension
                                  </label>
                                  <input
                                    type="text"
                                    value={suspensionReason}
                                    onChange={(e) => setSuspensionReason(e.target.value)}
                                    placeholder="e.g. Fraudulent voucher redemption pattern"
                                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                  />
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus("SUSPENDED", suspensionReason || "Admin suspension")}
                                      disabled={isUpdatingStatus}
                                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                      <UserX size={14} />
                                      <span>{isUpdatingStatus ? "Suspending..." : "Confirm Account Suspension"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowSuspendConfirm(false)}
                                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowSuspendConfirm(true)}
                                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                  <UserX size={14} />
                                  <span>Suspend Customer Account</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close Dossier
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Add / Register Customer Modal Dialog */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#121626] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
              <div className="flex items-center gap-2.5">
                <UserPlus size={18} className="text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Register New Customer Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    placeholder="e.g. Siddharth Deshpande"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Mobile Phone (+91) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    placeholder="+91 98220 00000"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    placeholder="siddharth@example.com"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Primary Operational City
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    placeholder="Nagpur"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Residential Street Address
                </label>
                <input
                  type="text"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  placeholder="Plot 10, Civil Lines, Nagpur"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={newCustomerForm.gender}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gender: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Postal PIN</label>
                  <input
                    type="text"
                    value={newCustomerForm.pincode}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })}
                    placeholder="440010"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Welcome Coins</label>
                  <input
                    type="number"
                    value={newCustomerForm.initialBonusCoins}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, initialBonusCoins: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingAdd ? "Registering in PostgreSQL..." : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
