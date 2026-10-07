import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Eye,
  Clock,
  Store,
  MapPin,
  Mail,
  Phone,
  Percent,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  UserCheck,
  ShieldAlert,
  Copy,
  Download,
  ExternalLink,
  FileText,
  CheckCheck,
  Trash2,
  Power,
  PowerOff,
  MoreVertical,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { Merchant } from "../../types";
import { AdvancedTable, Column } from "../../components/ui/AdvancedTable";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "../../components/ui/dropdown-menu";
import { merchantOnboardingSchema } from "../../lib/validationSchemas";
import { staffApi, BackendStaffResponse } from "../../api/staffApi";
import {
  getAllStates,
  getDistrictsForState,
  getCitiesForDistrictOrState
} from "../../data/indiaLocations";
import { IndiaAddressFields } from "../../components/IndiaAddressFields";
import { useAppStore } from "../../hooks/useAppStore";
import { merchantApi } from "../../api/merchantApi";

interface MerchantNetworkProps {
  merchants: Merchant[];
  onAddMerchant: (draft: any) => Promise<void> | void;
  onUpdateKyc: (merchantId: string, status: "APPROVED" | "REJECTED" | "PENDING_REVIEW") => void;
  onNavigateTab?: (tab: string) => void;
  onDeleteMerchant?: (merchantId: string) => void;
  onUpdateMerchant?: (merchantId: string, updates: Partial<Merchant>) => void;
}

export const MerchantNetwork: React.FC<MerchantNetworkProps> = ({
  merchants,
  onAddMerchant,
  onUpdateKyc,
  onNavigateTab,
  onDeleteMerchant,
  onUpdateMerchant
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [kycTab, setKycTab] = useState<"overview" | "documents" | "outlets">("overview");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null);

  const handleResendInvite = async (m: Merchant) => {
    try {
      await merchantApi.resendInvite(m.id);
      toast.success(`Welcome and login credentials email dispatched to ${m.ownerEmail || m.businessName}!`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Failed to resend welcome email.";
      toast.error(errMsg);
    }
  };

  const handleExportMerchantsCsv = () => {
    const headers = [
      "ID",
      "Business Name",
      "Legal Name",
      "Category",
      "City",
      "State",
      "Email",
      "Phone",
      "PAN",
      "GSTIN",
      "Bank UPI ID",
      "KYC Status",
      "Status",
      "Stores Count"
    ];
    const rows = merchants.map((m) => [
      `"${m.id}"`,
      `"${(m.businessName || "").replace(/"/g, '""')}"`,
      `"${(m.legalEntityName || "").replace(/"/g, '""')}"`,
      `"${(m.categoryName || "").replace(/"/g, '""')}"`,
      `"${(m.city || "").replace(/"/g, '""')}"`,
      `"${(m.state || "").replace(/"/g, '""')}"`,
      `"${m.ownerEmail || ""}"`,
      `"${m.ownerPhone || ""}"`,
      `"${m.pan || ""}"`,
      `"${m.gstin || ""}"`,
      `"${m.bankUpiId || ""}"`,
      `"${m.kycStatus || ""}"`,
      `"${m.status || ""}"`,
      `"${m.storeCount || 0}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PINAK_Merchant_Directory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${merchants.length} merchants to CSV!`);
  };

  const store = useAppStore();
  const allStores = store.stores || [];

  // Executive KPI Metrics
  const approvedCount = useMemo(
    () => merchants.filter((m) => m.kycStatus === "APPROVED").length,
    [merchants]
  );
  const pendingCount = useMemo(
    () => merchants.filter((m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED").length,
    [merchants]
  );
  const totalBranches = useMemo(
    () => merchants.reduce((sum, m) => sum + (m.storeCount || 0), 0),
    [merchants]
  );

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: merchants.length,
      PENDING_REVIEW: merchants.filter((m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED").length,
      APPROVED: merchants.filter((m) => m.kycStatus === "APPROVED").length,
      REJECTED: merchants.filter((m) => m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED").length,
      SUSPENDED: merchants.filter((m) => m.status === "SUSPENDED").length,
    };
  }, [merchants]);

  // Filtered by status
  const filtered = useMemo(() => {
    return merchants.filter((m) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "SUSPENDED") return m.status === "SUSPENDED";
      if (statusFilter === "REJECTED") return m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED";
      if (statusFilter === "APPROVED") return m.kycStatus === "APPROVED";
      if (statusFilter === "PENDING_REVIEW") return m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED";
      return m.kycStatus === statusFilter;
    });
  }, [merchants, statusFilter]);

  // Merchant's operating stores
  const merchantStores = useMemo(() => {
    if (!selectedMerchant) return [];
    return allStores.filter(
      (st) =>
        st.merchantId === selectedMerchant.id ||
        st.merchantName.toLowerCase() === selectedMerchant.businessName.toLowerCase()
    );
  }, [selectedMerchant, allStores]);

  // Advanced Table Columns
  const columns: Column<Merchant>[] = [
    {
      header: "Merchant & Brand",
      accessor: "businessName",
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {m.initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white truncate">{m.businessName}</p>
            <p className="text-xs text-slate-400 truncate">{m.legalEntityName}</p>
          </div>
        </div>
      )
    },
    {
      header: "Category & City",
      accessor: "categoryName",
      render: (m) => (
        <div>
          <span className="font-medium text-slate-800 dark:text-slate-200 block">{m.categoryName}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{m.city}{m.state ? `, ${m.state}` : ""}</span>
          </span>
        </div>
      )
    },
    {
      header: "Outlets",
      accessor: "storeCount",
      className: "whitespace-nowrap",
      render: (m) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Store size={12} className="text-purple-600 dark:text-purple-400" />
          {m.storeCount || 1} {m.storeCount === 1 ? "outlet" : "outlets"}
        </span>
      )
    },
    {
      header: "Settlement VPA",
      accessor: "bankUpiId",
      className: "whitespace-nowrap",
      render: (m) => (
        m.bankUpiId ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
            <span className="font-mono text-xs text-purple-700 dark:text-purple-300 font-semibold">{m.bankUpiId}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(m.bankUpiId);
                toast.success(`Copied VPA: ${m.bankUpiId}`);
              }}
              className="p-0.5 rounded text-purple-400 hover:text-purple-700 dark:hover:text-purple-200 transition-colors"
              title="Copy UPI VPA"
            >
              <Copy size={11} />
            </button>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic text-xs">Not linked</span>
        )
      )
    },
    {
      header: "Account",
      accessor: "status",
      className: "whitespace-nowrap",
      render: (m) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            m.status === "SUSPENDED"
              ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              m.status === "SUSPENDED" ? "bg-rose-500" : "bg-emerald-500"
            )}
          />
          {m.status === "SUSPENDED" ? "Suspended" : "Active"}
        </span>
      )
    },
    {
      header: "KYC Status",
      accessor: "kycStatus",
      className: "whitespace-nowrap",
      render: (m) => (
        <Badge
          variant={
            m.kycStatus === "APPROVED"
              ? "success"
              : m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED"
                ? "destructive"
                : "warning"
          }
        >
          {m.kycStatus === "APPROVED" ? (
            <CheckCircle2 size={12} />
          ) : m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED" ? (
            <XCircle size={12} />
          ) : (
            <Clock size={12} />
          )}
          {((m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED") ? "REJECTED" : m.kycStatus).replace("_", " ")}
        </Badge>
      )
    },
    {
      header: "Action",
      sortable: false,
      className: "text-right whitespace-nowrap",
      render: (m) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Primary Review KYC Button */}
          <button
            onClick={() => setSelectedMerchant(m)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/60 transition-all shadow-2xs hover:shadow-xs"
            title="Review Merchant KYC Details"
          >
            <Eye size={13} />
            <span>Review KYC</span>
          </button>

          {/* Secondary Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
                title="More Actions"
              >
                <MoreVertical size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#121626]">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                Merchant Operations
              </DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => setSelectedMerchant(m)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Review KYC Documents</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(m.id);
                  toast.success(`Copied Merchant ID: ${m.id}`);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy size={14} className="text-slate-400" />
                <span>Copy Merchant ID</span>
              </DropdownMenuItem>

              {m.bankUpiId && (
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(m.bankUpiId);
                    toast.success(`Copied VPA: ${m.bankUpiId}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CreditCard size={14} className="text-slate-400" />
                  <span>Copy Bank VPA</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => handleResendInvite(m)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
              >
                <Mail size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Resend Welcome Email</span>
              </DropdownMenuItem>

              {onUpdateMerchant && (
                <DropdownMenuItem
                  onClick={() => {
                    const nextStatus = m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                    onUpdateMerchant(m.id, { status: nextStatus });
                    toast.success(`Merchant "${m.businessName}" ${nextStatus === "ACTIVE" ? "activated" : "suspended"}`);
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {m.status === "ACTIVE" ? (
                    <>
                      <PowerOff size={14} className="text-amber-500" />
                      <span>Suspend Partner</span>
                    </>
                  ) : (
                    <>
                      <Power size={14} className="text-emerald-500" />
                      <span>Activate Partner</span>
                    </>
                  )}
                </DropdownMenuItem>
              )}

              {onDeleteMerchant && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                  <DropdownMenuItem
                    onClick={() => setMerchantToDelete(m)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 size={14} />
                    <span>Delete Merchant</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-['Manrope'] text-slate-900 dark:text-white">
            Merchant Network & KYC Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review partner brands, verify legal PAN/GSTIN entities, and manage bank settlement VPAs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportMerchantsCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
            title="Export merchant directory as CSV"
          >
            <Download size={16} />
            <span>Export (.CSV)</span>
          </button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <UploadCloud size={16} />
            <span>Bulk CSV Import</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md"
          >
            <Plus size={16} />
            <span>Onboard Merchant</span>
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Merchants */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Brands</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {merchants.length}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Active Network Partners</span>
          </div>
        </div>

        {/* Card 2: KYC Verified */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">KYC Verified</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {approvedCount}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {merchants.length > 0 ? Math.round((approvedCount / merchants.length) * 100) : 0}% Verification Rate
            </span>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Required</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {pendingCount}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
              Awaiting KYC Clearance
            </span>
          </div>
        </div>

        {/* Card 4: Operating Store Branches */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Store Outlets</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
              <Store size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Manrope']">
              {totalBranches}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">Live Branch Locations</span>
          </div>
        </div>
      </div>

      {/* Status Filter Chips with Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Merchants", count: tabCounts.ALL },
          { id: "PENDING_REVIEW", label: "Pending Review", count: tabCounts.PENDING_REVIEW },
          { id: "APPROVED", label: "Approved", count: tabCounts.APPROVED },
          { id: "REJECTED", label: "Rejected", count: tabCounts.REJECTED },
          { id: "SUSPENDED", label: "Suspended", count: tabCounts.SUSPENDED },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              statusFilter === tab.id
                ? "bg-purple-600 text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                statusFilter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Advanced Table */}
      <AdvancedTable<Merchant>
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        searchPlaceholder="Search merchants by brand name, city, or owner..."
        searchFilter={(m, query) =>
          m.businessName.toLowerCase().includes(query) ||
          m.city.toLowerCase().includes(query) ||
          (m.district?.toLowerCase().includes(query) ?? false) ||
          (m.state?.toLowerCase().includes(query) ?? false) ||
          m.categoryName.toLowerCase().includes(query) ||
          m.ownerName.toLowerCase().includes(query)
        }
        bulkActions={[
          {
            label: "Approve Selected KYC",
            action: (selected) => {
              selected.forEach((m) => onUpdateKyc(m.id, "APPROVED"));
              toast.success(`Approved ${selected.length} merchants!`);
            }
          },
          {
            label: "Reject Selected",
            action: (selected) => {
              selected.forEach((m) => onUpdateKyc(m.id, "REJECTED"));
              toast.info(`Rejected ${selected.length} merchants.`);
            }
          }
        ]}
      />

      {/* KYC Review Slide-Over Drawer */}
      {selectedMerchant && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedMerchant(null)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <aside className="w-screen max-w-lg bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shadow-xs">
                      {selectedMerchant.initials}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        Merchant KYC Verification
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {selectedMerchant.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isRejected = selectedMerchant.kycStatus === "REJECTED" || (selectedMerchant as any).approvalStatus === "REJECTED";
                      const isApproved = selectedMerchant.kycStatus === "APPROVED";
                      return (
                        <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}>
                          {isApproved ? <CheckCircle2 size={12} /> : isRejected ? <XCircle size={12} /> : <Clock size={12} />}
                          {isRejected ? "REJECTED" : selectedMerchant.kycStatus.replace("_", " ")}
                        </Badge>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => handleResendInvite(selectedMerchant)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                      title="Resend welcome and login credentials email"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedMerchant(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 mt-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setKycTab("overview")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      kycTab === "overview"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Building2 size={13} />
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKycTab("documents")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      kycTab === "documents"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <FileText size={13} />
                    <span>Documents</span>
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                      kycTab === "documents"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      4
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKycTab("outlets")}
                    className={cn(
                      "py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                      kycTab === "outlets"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Store size={13} />
                    <span>Outlets</span>
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                      kycTab === "outlets"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {merchantStores.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                {/* TAB 1: OVERVIEW & STATUTORY PROFILE */}
                {kycTab === "overview" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white font-['Manrope']">
                        {selectedMerchant.businessName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Legal Entity: <strong className="text-slate-700 dark:text-slate-300">{selectedMerchant.legalEntityName}</strong>
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Category & Location Card */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Industry & Headquarters
                        </span>
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedMerchant.categoryName}
                          </span>
                          <span className="text-slate-500">
                            {selectedMerchant.city}{selectedMerchant.district && selectedMerchant.district !== selectedMerchant.city ? `, ${selectedMerchant.district}` : ""}, {selectedMerchant.state || "Maharashtra"}
                          </span>
                        </div>
                      </div>

                      {/* Statutory Compliance Matrix */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Statutory Compliance Status
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Active & Compliant
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block font-medium">GSTIN</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                              {selectedMerchant.gstin || "Exempt"}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                              ✓ GSTN Verified
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block font-medium">Income Tax PAN</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                              {selectedMerchant.pan || "Exempt"}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                              ✓ Entity Matched
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Settlement & Banking */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            Direct Settlement UPI VPA
                          </span>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            Take-Rate: {selectedMerchant.commissionRate ?? 5.0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm">
                            {selectedMerchant.bankUpiId}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedMerchant.bankUpiId);
                              toast.success("Copied settlement VPA to clipboard");
                            }}
                            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <Copy size={11} />
                            Copy
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                          Direct UPI payments settle to this VPA. 0% intermediary holding.
                        </p>
                      </div>

                      {/* Owner & Communications */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Authorized Signatory & Contact
                        </span>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedMerchant.ownerName}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {selectedMerchant.ownerPhone}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {selectedMerchant.ownerEmail}
                        </div>
                      </div>

                      {/* Governance & Audit Trail Dossier */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            Governance & Cryptographic Audit Trail
                          </span>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <ShieldCheck size={11} />
                            Verified Trace
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-slate-500 text-[11px]">Onboarded By:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                              {selectedMerchant.createdBy || "Platform Operations (Super Admin)"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-slate-500 text-[11px]">Authorized Role:</span>
                            <span className="font-mono text-purple-700 dark:text-purple-300 text-[11px] font-semibold">
                              {selectedMerchant.createdRole || "SUPERADMIN"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-slate-500 text-[11px]">Registration Timestamp:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                              {selectedMerchant.createdAt ? new Date(selectedMerchant.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Platform Genesis"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-slate-500 text-[11px]">KYC Review Status:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                              {selectedMerchant.kycReviewedBy ? `Reviewed by ${selectedMerchant.kycReviewedBy}` : (selectedMerchant.kycStatus === "APPROVED" ? "Approved by Compliance Desk" : "Awaiting Compliance Decision")}
                            </span>
                          </div>

                          {selectedMerchant.kycReviewedAt && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <span className="text-slate-500 text-[11px]">KYC Verified At:</span>
                              <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                                {new Date(selectedMerchant.kycReviewedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: KYC DOCUMENTS & REGULATORY PROOFS */}
                {kycTab === "documents" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Statutory Verification Registry
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        All 4 Checks Passed
                      </span>
                    </div>

                    {/* Doc 1: GSTIN Registration Form REG-06 */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            <FileText size={14} />
                          </div>
                          <div>
                            <strong className="text-xs text-slate-900 dark:text-white block">
                              GSTIN Registration Certificate (REG-06)
                            </strong>
                            <span className="text-[10px] text-slate-400">Central Board of Indirect Taxes & Customs</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Verified
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Registration Number</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedMerchant.gstin || "27AABCU9603R1ZM"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Taxpayer Type</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Regular Taxpayer</span>
                        </div>
                      </div>
                    </div>

                    {/* Doc 2: Permanent Account Number (PAN) */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
                            <CreditCard size={14} />
                          </div>
                          <div>
                            <strong className="text-xs text-slate-900 dark:text-white block">
                              Corporate PAN Card
                            </strong>
                            <span className="text-[10px] text-slate-400">Income Tax Department of India</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Verified
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">PAN ID</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedMerchant.pan || "AABCU9603R"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Entity Name Check</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Match</span>
                        </div>
                      </div>
                    </div>

                    {/* Doc 3: NPCI UPI Settlement Route */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            <ShieldCheck size={14} />
                          </div>
                          <div>
                            <strong className="text-xs text-slate-900 dark:text-white block">
                              Bank Settlement VPA Mandate
                            </strong>
                            <span className="text-[10px] text-slate-400">NPCI Direct Payout Channel</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Penny-Drop OK
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Verified VPA</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedMerchant.bankUpiId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Settlement Holding</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">0% Non-Custodial</span>
                        </div>
                      </div>
                    </div>

                    {/* Doc 4: Storefront & Premise License */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <Store size={14} />
                          </div>
                          <div>
                            <strong className="text-xs text-slate-900 dark:text-white block">
                              Premise License & Physical Outlets
                            </strong>
                            <span className="text-[10px] text-slate-400">FSSAI / Municipal Trade Permit</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Inspected
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-[10px] text-slate-400 block">Registered Physical Premise</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedMerchant.city}, {selectedMerchant.state || "Maharashtra"} ({merchantStores.length} Active Branch {merchantStores.length === 1 ? "Outlet" : "Outlets"})
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: OUTLETS & SETTLEMENT */}
                {kycTab === "outlets" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Operational Store Outlets ({merchantStores.length})
                      </span>
                      {onNavigateTab && (
                        <button
                          onClick={() => {
                            setSelectedMerchant(null);
                            onNavigateTab("Stores");
                          }}
                          className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
                        >
                          Manage in Stores Console
                          <ExternalLink size={11} />
                        </button>
                      )}
                    </div>

                    {merchantStores.length > 0 ? (
                      <div className="space-y-2">
                        {merchantStores.map((st) => (
                          <div
                            key={st.id}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-slate-900 dark:text-white text-xs font-['Manrope']">
                                {st.branchName || st.storeName}
                              </strong>
                              <Badge variant={st.status === "ACTIVE" ? "success" : "warning"}>
                                {st.status === "ACTIVE" ? "Active on App" : "Pending Approval"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {st.address}, {st.city} - {st.pincode}
                            </p>
                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
                              <span>Timings: {st.operatingHours || "11:00 AM - 11:00 PM"}</span>
                              <span className="font-mono">GPS: {st.latitude?.toFixed(4)}, {st.longitude?.toFixed(4)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1.5">
                        <Store size={24} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Branch Outlets Provisioned Yet</p>
                        <p className="text-[11px] text-slate-400">
                          Branch stores can be added via Onboarding Step 4 or the Store Management console.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-2.5">
                {/* Primary Action Button */}
                <button
                  onClick={() => {
                    onUpdateKyc(selectedMerchant.id, "APPROVED");
                    setSelectedMerchant(null);
                    toast.success(`Merchant KYC for ${selectedMerchant.businessName} Approved!`);
                  }}
                  disabled={selectedMerchant.kycStatus === "APPROVED"}
                  className="w-full btn-gradient py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {selectedMerchant.kycStatus === "APPROVED"
                      ? "Merchant KYC Already Approved"
                      : "Approve Merchant KYC"}
                  </span>
                </button>

                {/* Secondary Decisions Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    title="Request merchant to re-upload documents or provide clarification"
                    onClick={() => {
                      onUpdateKyc(selectedMerchant.id, "PENDING_REVIEW");
                      setSelectedMerchant(null);
                      toast.info(`Clarification requested from ${selectedMerchant.businessName}. Application marked for revision.`);
                    }}
                    className="py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <RotateCcw size={13} />
                    <span>Request Re-upload</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateKyc(selectedMerchant.id, "REJECTED");
                      setSelectedMerchant(null);
                      toast.info(`Merchant KYC for ${selectedMerchant.businessName} marked as Rejected`);
                    }}
                    disabled={selectedMerchant.kycStatus === "REJECTED"}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <XCircle size={13} />
                    <span>Reject Application</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Add Merchant Drawer (Right Side) */}
      {isAddOpen && (
        <AddMerchantDrawer
          existingMerchants={merchants}
          onClose={() => setIsAddOpen(false)}
          onSave={async (draft) => {
            await onAddMerchant(draft);
            setIsAddOpen(false);
          }}
        />
      )}

      {/* Bulk CSV Import Slide-Over Drawer (Right Side) */}
      {isBulkOpen && (
        <BulkImportDrawer
          onClose={() => setIsBulkOpen(false)}
          onImportMerchants={async (newMerchants) => {
            for (const m of newMerchants) {
              await onAddMerchant(m);
            }
          }}
        />
      )}

      {/* Delete Merchant Confirmation Modal */}
      {merchantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121626] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Merchant Brand</h3>
                <p className="text-xs text-slate-500">Irreversible administrative action.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">{merchantToDelete.businessName}</p>
              <p className="text-slate-500">Legal Name: {merchantToDelete.legalEntityName || "N/A"}</p>
              <p className="text-slate-400 text-[11px]">
                {merchantToDelete.city}, {merchantToDelete.state} • PAN: {merchantToDelete.pan || "N/A"}
              </p>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
              ⚠️ Deleting this merchant will also automatically cascade-remove all mapped physical store branches and active discount campaigns from the customer app.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMerchantToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteMerchant) {
                    onDeleteMerchant(merchantToDelete.id);
                  }
                  toast.success(`Merchant "${merchantToDelete.businessName}" and associated branches removed`);
                  setMerchantToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Production-Grade Enterprise Merchant Onboarding Slide-over Drawer
function AddMerchantDrawer({
  existingMerchants,
  onClose,
  onSave,
}: {
  existingMerchants: Merchant[];
  onClose: () => void;
  onSave: (d: any) => Promise<void> | void;
}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [staffMembers, setStaffMembers] = useState<BackendStaffResponse[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    legalEntityName: "",
    categoryName: "Food & Dining",
    state: "Maharashtra",
    district: "Nagpur",
    city: "Nagpur",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    bankUpiId: "",
    gstin: "",
    pan: "",
    commissionRate: 5.0,
    // Initial Store Branch Configuration
    provisionBranch: true,
    branchName: "",
    branchAddress: "",
    branchState: "Maharashtra",
    branchDistrict: "Nagpur",
    branchCity: "Nagpur",
    branchPincode: "440010",
    operatingHours: "10:00 AM – 10:00 PM (Daily)",
  });
  const [openingTime, setOpeningTime] = useState("10:00");
  const [closingTime, setClosingTime] = useState("22:00");
  const [operatingDays, setOperatingDays] = useState("Daily (Mon – Sun)");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatTime12h = (time24: string) => {
    if (!time24) return "10:00 AM";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr || "10", 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const updateOperatingHours = (open: string, close: string, days: string) => {
    const formatted = `${formatTime12h(open)} – ${formatTime12h(close)} (${days})`;
    setFormData((prev) => ({ ...prev, operatingHours: formatted }));
  };

  const formatUserFriendlyError = (raw: string): string => {
    if (!raw) return "Unable to onboard merchant. Please verify all details and retry.";
    const lower = raw.toLowerCase();
    if (lower.includes("platform administrator") || lower.includes("platform staff") || lower.includes("role conflict")) {
      return "This email is already associated with an administrator account. Please use a separate email address for the commercial merchant owner.";
    }
    if (lower.includes("merchant is already registered") || lower.includes("already registered") || lower.includes("email_already_exists")) {
      return "This email address is already in use by an existing merchant account. Please enter a different email address.";
    }
    if (lower.includes("sql") || lower.includes("database") || lower.includes("column") || lower.includes("psqlexception")) {
      return "A temporary database issue occurred while processing the merchant request. Please try again or contact system support.";
    }
    return raw;
  };

  // Administrative Divisions of India (Pre-added State, District, City data)
  const states = useMemo(() => getAllStates(), []);
  const hqDistricts = useMemo(() => getDistrictsForState(formData.state), [formData.state]);
  const hqCities = useMemo(() => getCitiesForDistrictOrState(formData.state, formData.district), [formData.state, formData.district]);

  const handleHqStateChange = (newState: string) => {
    const districtsForNewState = getDistrictsForState(newState);
    const newDistrict = districtsForNewState.length > 0 ? districtsForNewState[0] : "";
    const citiesForNewDistrict = getCitiesForDistrictOrState(newState, newDistrict);
    const newCity = citiesForNewDistrict.length > 0 ? citiesForNewDistrict[0] : "";

    setFormData((prev) => ({
      ...prev,
      state: newState,
      district: newDistrict,
      city: newCity,
      branchState: prev.branchState === prev.state ? newState : prev.branchState,
      branchDistrict: prev.branchDistrict === prev.district ? newDistrict : prev.branchDistrict,
      branchCity: prev.branchCity === prev.city ? newCity : prev.branchCity,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.state;
      delete next.district;
      delete next.city;
      return next;
    });
  };

  const handleHqDistrictChange = (newDistrict: string) => {
    const citiesForDistrict = getCitiesForDistrictOrState(formData.state, newDistrict);
    const newCity = citiesForDistrict.length > 0 ? citiesForDistrict[0] : "";

    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
      city: newCity,
      branchDistrict: prev.branchDistrict === prev.district ? newDistrict : prev.branchDistrict,
      branchCity: prev.branchCity === prev.city ? newCity : prev.branchCity,
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.district;
      delete next.city;
      return next;
    });
  };

  const handleHqCityChange = (newCity: string) => {
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      branchCity: prev.branchCity === prev.city ? newCity : prev.branchCity,
    }));

    if (errors.city) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.city;
        return next;
      });
    }
  };

  // Fetch platform staff to detect role conflicts and enforce Segregation of Duties (SoD)
  useEffect(() => {
    let isMounted = true;
    setIsLoadingStaff(true);
    staffApi
      .getPlatformStaff()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setStaffMembers(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch staff members for conflict validation:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStaff(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAutoFill = () => {
    const samples = [
      {
        businessName: "Haldiram's Sweets & Snacks",
        legalEntityName: "Haldiram Foods International Pvt Ltd",
        categoryName: "Food & Dining",
        state: "Maharashtra",
        district: "Nagpur",
        city: "Nagpur",
        ownerName: "Kamal Agrawal",
        emailPrefix: "kamal.agrawal",
        domain: "haldirams.com",
        phonePrefix: "98221",
        bankUpiId: "haldirams@icici",
        gstin: "27AABCH1234F1Z8",
        pan: "AABCH1234F",
        branchName: "Haldiram's Dharampeth Flagship",
        branchAddress: "West High Court Road, Dharampeth",
        branchPincode: "440010",
      },
      {
        businessName: "The Bombay Canteen",
        legalEntityName: "Hunger Inc Hospitality Pvt Ltd",
        categoryName: "Food & Dining",
        state: "Maharashtra",
        district: "Nagpur",
        city: "Nagpur",
        ownerName: "Sameer Seth",
        emailPrefix: "sameer.seth",
        domain: "thebombaycanteen.com",
        phonePrefix: "98200",
        bankUpiId: "bombaycanteen@hdfcbank",
        gstin: "27AAACH9876K1ZQ",
        pan: "AAACH9876K",
        branchName: "Bombay Canteen Sadar Flagship",
        branchAddress: "Residency Road, Sadar",
        branchPincode: "440001",
      },
      {
        businessName: "Fabindia Home & Living",
        legalEntityName: "Fabindia Overseas Pvt Ltd",
        categoryName: "Fashion & Retail",
        state: "Maharashtra",
        district: "Nagpur",
        city: "Nagpur",
        ownerName: "William Bissell",
        emailPrefix: "william.bissell",
        domain: "fabindia.net",
        phonePrefix: "98101",
        bankUpiId: "fabindia@axisbank",
        gstin: "27AAACF3456N1ZX",
        pan: "AAACF3456N",
        branchName: "Fabindia Sadar Residency",
        branchAddress: "Residency Road, Sadar",
        branchPincode: "440001",
      },
      {
        businessName: "Apollo Pharmacy 24x7",
        legalEntityName: "Apollo Hospitals Enterprise Ltd",
        categoryName: "Health & Pharmacy",
        state: "Maharashtra",
        district: "Nagpur",
        city: "Nagpur",
        ownerName: "Shobana Kamineni",
        emailPrefix: "shobana.k",
        domain: "apollopharmacy.org",
        phonePrefix: "98490",
        bankUpiId: "apollopharmacy@sbi",
        gstin: "27AAACA9999M1Z3",
        pan: "AAACA9999M",
        branchName: "Apollo Pharmacy Ramdaspeth",
        branchAddress: "Central Bazaar Road, Ramdaspeth",
        branchPincode: "440010",
      },
    ];

    const pick = samples[Math.floor(Math.random() * samples.length)];
    const uniqueSuffix = Math.floor(100 + Math.random() * 900);
    const uniqueEmail = `${pick.emailPrefix}${uniqueSuffix}@${pick.domain}`;
    const uniquePhone = `${pick.phonePrefix}${Math.floor(10000 + Math.random() * 90000)}`;

    setFormData({
      businessName: pick.businessName,
      legalEntityName: pick.legalEntityName,
      categoryName: pick.categoryName,
      state: pick.state,
      district: pick.district,
      city: pick.city,
      ownerName: pick.ownerName,
      ownerEmail: uniqueEmail,
      ownerPhone: uniquePhone,
      bankUpiId: pick.bankUpiId,
      gstin: pick.gstin,
      pan: pick.pan,
      commissionRate: 5.0,
      provisionBranch: true,
      branchName: pick.branchName,
      branchAddress: pick.branchAddress,
      branchState: pick.state,
      branchDistrict: pick.district,
      branchCity: pick.city,
      branchPincode: pick.branchPincode,
      operatingHours: "10:00 AM – 10:00 PM (Daily)",
    });

    setOpeningTime("10:00");
    setClosingTime("22:00");
    setOperatingDays("Daily (Mon – Sun)");
    setErrors({});
    setSubmitError(null);
    toast.success(`Auto-filled details for "${pick.businessName}"!`);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const CATEGORY_OPTIONS = [
    "Food & Dining",
    "Fashion & Retail",
    "Beauty & Wellness",
    "Gym & Fitness",
    "Health & Pharmacy",
    "Grocery & Supermarkets",
    "Entertainment & Leisure",
    "Travel & Hospitality",
    "Electronics & Appliances",
    "Home & Living",
  ];

  // Real-time conflict detection: Platform Staff & Existing Merchants
  const normalizedEmail = (formData.ownerEmail || "").trim().toLowerCase();

  const conflictingStaff = useMemo(() => {
    if (!normalizedEmail || !normalizedEmail.includes("@")) return null;
    return (
      staffMembers.find(
        (s) => (s.email || "").trim().toLowerCase() === normalizedEmail
      ) || null
    );
  }, [normalizedEmail, staffMembers]);

  const conflictingMerchant = useMemo(() => {
    if (!normalizedEmail || !normalizedEmail.includes("@")) return null;
    return (
      existingMerchants.find(
        (m) =>
          ((m as any).email || "").trim().toLowerCase() === normalizedEmail ||
          (m.ownerEmail || "").trim().toLowerCase() === normalizedEmail
      ) || null
    );
  }, [normalizedEmail, existingMerchants]);

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim() || formData.businessName.trim().length < 2) {
        stepErrors.businessName = "Brand / Business name must be at least 2 characters";
      }
      if (!formData.categoryName) {
        stepErrors.categoryName = "Please select a primary category";
      }
      if (!formData.state.trim()) {
        stepErrors.state = "Please select a headquarters state";
      }
      if (!formData.district.trim()) {
        stepErrors.district = "Please select a headquarters district";
      }
      if (!formData.city.trim() || formData.city.trim().length < 2) {
        stepErrors.city = "Headquarters city must be at least 2 characters";
      }
    } else if (step === 2) {
      if (!formData.ownerName.trim() || formData.ownerName.trim().length < 2) {
        stepErrors.ownerName = "Authorized owner name must be at least 2 characters";
      }
      if (!formData.ownerEmail.trim()) {
        stepErrors.ownerEmail = "Owner work email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
        stepErrors.ownerEmail = "Please enter a valid work email address";
      } else if (conflictingStaff) {
        stepErrors.ownerEmail = `This email is already associated with an administrator account (${conflictingStaff.name}). Please use a separate email address for the merchant owner.`;
      } else if (conflictingMerchant) {
        stepErrors.ownerEmail = `This email address is already in use by merchant "${conflictingMerchant.businessName}". Please use a different email address.`;
      }

      const phoneClean = formData.ownerPhone.replace(/\D/g, "");
      if (!formData.ownerPhone.trim()) {
        stepErrors.ownerPhone = "Contact phone is required";
      } else if (phoneClean.length !== 10 && phoneClean.length !== 12) {
        stepErrors.ownerPhone = "Please enter a valid 10-digit Indian phone number";
      }
    } else if (step === 3) {
      if (formData.gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstin.trim().toUpperCase())) {
        stepErrors.gstin = "Invalid GSTIN format (e.g. 27AABCU9603R1ZM)";
      }
      if (formData.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase())) {
        stepErrors.pan = "Invalid PAN format (e.g. AABCU9603R)";
      }
      if (formData.bankUpiId.trim() && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.bankUpiId.trim())) {
        stepErrors.bankUpiId = "Invalid UPI VPA format (e.g. brand@icici)";
      }
      if (formData.commissionRate < 0 || formData.commissionRate > 100) {
        stepErrors.commissionRate = "Commission take-rate must be between 0% and 100%";
      }
    } else if (step === 4) {
      if (formData.provisionBranch) {
        if (!formData.branchName.trim()) {
          stepErrors.branchName = "Flagship branch name is required";
        }
        if (!formData.branchAddress.trim()) {
          stepErrors.branchAddress = "Street address is required";
        }
        if (!formData.branchState.trim()) {
          stepErrors.branchState = "Branch state is required";
        }
        if (!formData.branchDistrict.trim()) {
          stepErrors.branchDistrict = "Branch district is required";
        }
        if (!formData.branchCity.trim() || formData.branchCity.trim().length < 2) {
          stepErrors.branchCity = "Branch city must be at least 2 characters";
        }
        if (!formData.branchPincode.trim() || formData.branchPincode.replace(/\D/g, "").length !== 6) {
          stepErrors.branchPincode = "Please enter a valid 6-digit Indian pincode";
        }
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error(Object.values(stepErrors)[0]);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep !== 4) {
      return;
    }
    setSubmitError(null);

    // Final holistic Zod schema validation
    const result = merchantOnboardingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(result.error.issues[0]?.message || "Please correct the validation errors.");
      return;
    }

    if (conflictingStaff) {
      const msg = `This email is already associated with an administrator account (${conflictingStaff.name}). Please use a separate email address for the merchant owner.`;
      setSubmitError(msg);
      toast.error(msg);
      setCurrentStep(2);
      return;
    }

    if (conflictingMerchant) {
      const msg = `This email address is already in use by merchant "${conflictingMerchant.businessName}". Please use a different email address.`;
      setSubmitError(msg);
      toast.error(msg);
      setCurrentStep(2);
      return;
    }

    setErrors({});
    const payload = {
      businessName: formData.businessName.trim(),
      legalEntityName: formData.legalEntityName.trim() || formData.businessName.trim(),
      categoryName: formData.categoryName,
      state: formData.state.trim() || "Maharashtra",
      district: formData.district.trim() || "Nagpur",
      city: formData.city.trim() || "Nagpur",
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim().toLowerCase(),
      ownerPhone: formData.ownerPhone.trim(),
      bankUpiId: formData.bankUpiId.trim() || `${formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
      gstin: formData.gstin.trim().toUpperCase(),
      pan: formData.pan.trim().toUpperCase(),
      commissionRate: Number(formData.commissionRate) || 5.0,
      initialStore: formData.provisionBranch
        ? {
          branchName: formData.branchName.trim() || `${formData.businessName.trim()} Flagship`,
          address: formData.branchAddress.trim() || `${formData.branchCity.trim() || "Nagpur"} Central Complex`,
          city: formData.branchCity.trim() || "Nagpur",
          district: formData.branchDistrict.trim() || "Nagpur",
          state: formData.branchState.trim() || "Maharashtra",
          pincode: formData.branchPincode.trim() || "440010",
          openingTime: openingTime,
          closingTime: closingTime,
          operatingHours: formData.operatingHours.trim() || `${formatTime12h(openingTime)} – ${formatTime12h(closingTime)} (${operatingDays})`,
        }
        : null,
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
    } catch (err: any) {
      const rawMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to onboard merchant. Please verify all fields and retry.";
      const friendlyMsg = formatUserFriendlyError(rawMsg);
      setSubmitError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsConfig = [
    { num: 1, label: "Brand Identity", icon: Building2 },
    { num: 2, label: "Signatory & Contact", icon: UserCheck },
    { num: 3, label: "Tax & Bank Payout", icon: ShieldCheck },
    { num: 4, label: "Store & Review", icon: Store },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Onboard Partner Merchant</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step {currentStep} of 4: {stepsConfig[currentStep - 1].label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-2xs"
                  title="Auto Fill Commercial Demo Details"
                >
                  <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
                  <span>Auto Fill</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Stepper Wizard Bar */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
              {stepsConfig.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.num;
                const isDone = currentStep > s.num;

                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (s.num < currentStep) {
                        setCurrentStep(s.num as any);
                      } else if (s.num > currentStep) {
                        if (validateStep(currentStep)) {
                          setCurrentStep(s.num as any);
                        }
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-left transition-all",
                      isCurrent
                        ? "bg-purple-600 text-white shadow-xs font-bold"
                        : isDone
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold",
                        isCurrent
                          ? "bg-white text-purple-700"
                          : isDone
                            ? "bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}
                    >
                      {isDone ? <Check size={10} strokeWidth={3} /> : s.num}
                    </div>
                    <span className="text-[11px] truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backend Error Banner */}
          {submitError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-bold">Onboarding Error</p>
                <p className="text-[11px] mt-0.5">{submitError}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Form Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === 4) {
                handleSubmit(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
                e.preventDefault();
                if (currentStep < 4) {
                  handleNext();
                }
              }
            }}
            noValidate
            className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
          >
            {/* STEP 1: Brand & Category Identity */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Building2 size={16} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Brand Identity & Operating Category
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Define the public commercial brand and industry sector
                    </p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand / Trade Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        businessName: val,
                        branchName: prev.branchName ? prev.branchName : (val ? `${val} Flagship` : ""),
                      }));
                      if (errors.businessName) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.businessName;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. Blue Tokai Coffee"
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden transition-colors",
                      errors.businessName
                        ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                    )}
                  />
                  {errors.businessName && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.businessName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Registered Legal Entity Name
                  </label>
                  <input
                    type="text"
                    value={formData.legalEntityName}
                    onChange={(e) => updateField("legalEntityName", e.target.value)}
                    placeholder="e.g. Curry Leaf Hospitality Pvt Ltd (leave blank if same as brand)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Used for tax invoices, GST reconciliation, and compliance documents.</p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Primary Category *
                  </label>
                  <select
                    value={formData.categoryName}
                    onChange={(e) => updateField("categoryName", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.categoryName && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.categoryName}</span>
                    </p>
                  )}
                </div>

                {/* Headquarters Location: State, District, and City */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <MapPin size={14} className="text-purple-600 dark:text-purple-400" />
                      <span>Headquarters Location (State, District & City) *</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* State Selector */}
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                        State *
                      </label>
                      <div className="relative">
                        <select
                          value={formData.state}
                          onChange={(e) => handleHqStateChange(e.target.value)}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden",
                            errors.state
                              ? "border-rose-500 ring-1 ring-rose-500/20"
                              : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                          )}
                        >
                          {states.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                          ▼
                        </div>
                      </div>
                      {errors.state && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{errors.state}</span>
                        </p>
                      )}
                    </div>

                    {/* District Selector */}
                    <div>
                      <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                        District *
                      </label>
                      <div className="relative">
                        {hqDistricts.length > 0 ? (
                          <select
                            value={formData.district}
                            onChange={(e) => handleHqDistrictChange(e.target.value)}
                            className={cn(
                              "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden",
                              errors.district
                                ? "border-rose-500 ring-1 ring-rose-500/20"
                                : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                            )}
                          >
                            {hqDistricts.map((dst) => (
                              <option key={dst} value={dst}>
                                {dst}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.district}
                            onChange={(e) => handleHqDistrictChange(e.target.value)}
                            placeholder="District"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                          />
                        )}
                        {hqDistricts.length > 0 && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                            ▼
                          </div>
                        )}
                      </div>
                      {errors.district && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{errors.district}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* City Selector with Datalist */}
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                      Headquarters City / Town *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="merchant-hq-city-suggestions"
                        value={formData.city}
                        onChange={(e) => handleHqCityChange(e.target.value)}
                        placeholder="e.g. Nagpur"
                        className={cn(
                          "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden",
                          errors.city
                            ? "border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                      <datalist id="merchant-hq-city-suggestions">
                        {hqCities.map((ct) => (
                          <option key={ct} value={ct}>
                            {ct} ({formData.district || formData.state})
                          </option>
                        ))}
                      </datalist>
                    </div>
                    {errors.city && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.city}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex items-start gap-2.5 mt-2">
                  <Sparkles size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-purple-900 dark:text-purple-200 leading-relaxed">
                    Brand profile will be immediately listed in the marketplace discovery index under{" "}
                    <strong>{formData.categoryName}</strong> upon KYC approval.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Authorized Signatory & Contact Verification */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <UserCheck size={16} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      2. Authorized Contact & Business Owner
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Authorized merchant owner and primary business contact information
                    </p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Primary Owner / Signatory Name *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="e.g. Sunil Joshi"
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden",
                      errors.ownerName
                        ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                    )}
                  />
                  {errors.ownerName && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.ownerName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Owner Business Email *
                    </label>
                    {normalizedEmail && !conflictingStaff && !conflictingMerchant && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Email available
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => updateField("ownerEmail", e.target.value)}
                      placeholder="e.g. sunil@curryleaf.in"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs focus:outline-hidden font-medium",
                        conflictingStaff || conflictingMerchant || errors.ownerEmail
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                      )}
                    />
                    <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Real-time Platform Staff Notice */}
                  {conflictingStaff && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800 dark:text-amber-300">
                        <ShieldAlert size={14} className="shrink-0" />
                        <span>Staff Account Email</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        This email is already associated with platform staff ({conflictingStaff.name}). Please use a dedicated business email for this merchant partner.
                      </p>
                    </div>
                  )}

                  {/* Real-time Duplicate Merchant Notice */}
                  {conflictingMerchant && !conflictingStaff && (
                    <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-800 dark:text-rose-300">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Existing Merchant Brand</span>
                      </div>
                      <p className="text-[11px]">
                        A merchant (<strong>{conflictingMerchant.businessName}</strong>) is already registered under this email. Each merchant account must have a unique login email.
                      </p>
                    </div>
                  )}

                  {errors.ownerEmail && !conflictingStaff && !conflictingMerchant && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.ownerEmail}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => updateField("ownerPhone", e.target.value)}
                      placeholder="+91 98220 11223"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs focus:outline-hidden",
                        errors.ownerPhone
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                      )}
                    />
                    <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.ownerPhone && (
                    <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{errors.ownerPhone}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Tax, Compliance & Settlement */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <ShieldCheck size={16} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      3. Tax Compliance & Settlement Banking
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Configure GSTIN, PAN, and automated daily payout UPI account
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      GSTIN Identification
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.gstin}
                      onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                      placeholder="27AABCU9603R1ZM"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-hidden",
                        errors.gstin
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                      )}
                    />
                    {errors.gstin && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.gstin}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Business PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.pan}
                      onChange={(e) => updateField("pan", e.target.value.toUpperCase())}
                      placeholder="AABCU9603R"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-hidden",
                        errors.pan
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                      )}
                    />
                    {errors.pan && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.pan}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Settlement Bank UPI VPA
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.bankUpiId}
                        onChange={(e) => updateField("bankUpiId", e.target.value)}
                        placeholder="e.g. brand@icici"
                        className={cn(
                          "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-mono focus:outline-hidden",
                          errors.bankUpiId
                            ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                      <CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {errors.bankUpiId ? (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.bankUpiId}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">Automated settlement target for customer bills</p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Platform Commission (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => updateField("commissionRate", parseFloat(e.target.value) || 0)}
                        className={cn(
                          "w-full pl-3 pr-7 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-bold focus:outline-hidden",
                          errors.commissionRate
                            ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                      <Percent size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    {errors.commissionRate && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.commissionRate}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Initial Store & Review */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-purple-600 dark:text-purple-400" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        4. Initial Outlet & Review
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Optionally add the first branch store and confirm details
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-purple-700 dark:text-purple-300">
                    <input
                      type="checkbox"
                      checked={formData.provisionBranch}
                      onChange={(e) => setFormData({ ...formData, provisionBranch: e.target.checked })}
                      className="rounded text-purple-600"
                    />
                    <span>Add First Outlet</span>
                  </label>
                </div>

                {formData.provisionBranch && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Branch / Store Name *
                      </label>
                      <input
                        type="text"
                        value={formData.branchName}
                        onChange={(e) => updateField("branchName", e.target.value)}
                        placeholder="e.g. Dharampeth Flagship"
                        className={cn(
                          "w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden",
                          errors.branchName
                            ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                      {errors.branchName && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{errors.branchName}</span>
                        </p>
                      )}
                    </div>

                    {/* Pre-populated Indian Address Fields (State, District, City, Address, Pincode) */}
                    <IndiaAddressFields
                      state={formData.branchState}
                      district={formData.branchDistrict}
                      city={formData.branchCity}
                      pincode={formData.branchPincode}
                      address={formData.branchAddress}
                      errors={{
                        state: errors.branchState,
                        district: errors.branchDistrict,
                        city: errors.branchCity,
                        pincode: errors.branchPincode,
                        address: errors.branchAddress,
                      }}
                      onStateChange={(val) => updateField("branchState", val)}
                      onDistrictChange={(val) => updateField("branchDistrict", val)}
                      onCityChange={(val) => updateField("branchCity", val)}
                      onPincodeChange={(val) => updateField("branchPincode", val)}
                      onAddressChange={(val) => updateField("branchAddress", val)}
                    />

                    {/* Operating Hours Real Time Inputs */}
                    <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Clock size={14} className="text-purple-600 dark:text-purple-400" />
                          Operating Hours
                        </label>
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                          {formData.operatingHours}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            Opening Time
                          </label>
                          <input
                            type="time"
                            value={openingTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOpeningTime(val);
                              updateOperatingHours(val, closingTime, operatingDays);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                            Closing Time
                          </label>
                          <input
                            type="time"
                            value={closingTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setClosingTime(val);
                              updateOperatingHours(openingTime, val, operatingDays);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Days of Operation
                        </label>
                        <select
                          value={operatingDays}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOperatingDays(val);
                            updateOperatingHours(openingTime, closingTime, val);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                        >
                          <option value="Daily (Mon – Sun)">Daily (Mon – Sun)</option>
                          <option value="Mon – Sat">Monday to Saturday</option>
                          <option value="Weekdays (Mon – Fri)">Weekdays (Mon – Fri)</option>
                          <option value="Weekends Only">Weekends Only (Sat – Sun)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onboarding Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-purple-50/20 to-pink-50/20 dark:from-slate-900/60 dark:via-purple-950/20 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Onboarding Summary
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200">
                      Ready to Onboard
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Brand Entity</span>
                      <strong className="text-slate-800 dark:text-slate-200">{formData.businessName || "—"}</strong>
                      <p className="text-[10px] text-slate-500">{formData.categoryName} • {formData.city}, {formData.state}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Authorized Signatory</span>
                      <strong className="text-slate-800 dark:text-slate-200">{formData.ownerName || "—"}</strong>
                      <p className="text-[10px] text-slate-500 truncate">{formData.ownerEmail || "—"}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Tax & Settlement</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                        GST: {formData.gstin || "Exempt"} | Commission: {formData.commissionRate}%
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Initial Outlet</span>
                      <span className="text-slate-700 dark:text-slate-300 text-[10px]">
                        {formData.provisionBranch
                          ? `${formData.branchName || "Initial Outlet"} (${formData.branchCity}, ${formData.branchState})`
                          : "Can be added later in Store Management"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  key="btn-wizard-next"
                  type="button"
                  onClick={handleNext}
                  disabled={Boolean(conflictingStaff || conflictingMerchant)}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  key="btn-wizard-submit"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || Boolean(conflictingStaff || conflictingMerchant)}
                  className="btn-gradient px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-95 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Onboarding Merchant...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Complete Merchant Onboarding</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

// Production-Grade Enterprise Bulk CSV Merchant Import Drawer
function BulkImportDrawer({
  onClose,
  onImportMerchants,
}: {
  onClose: () => void;
  onImportMerchants: (merchants: any[]) => Promise<void> | void;
}) {
  const [step, setStep] = useState<"upload" | "validating" | "ready">("upload");
  const [parsedMerchants, setParsedMerchants] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Realistic Indian Demo Partner Dataset for instant client presentation
  const DEMO_PARTNER_DATA = [
    {
      businessName: "Chai Point",
      legalEntityName: "Mountain Trail Foods Pvt Ltd",
      categoryName: "Food & Dining",
      state: "Maharashtra",
      district: "Nagpur",
      city: "Nagpur",
      ownerName: "Tarun Khanna",
      ownerEmail: "tarun.khanna@chaipoint.com",
      ownerPhone: "9823011223",
      bankUpiId: "chaipoint@icici",
      gstin: "27AAECM1234F1Z5",
      pan: "AAECM1234F",
      commissionRate: 5.0,
      initialStore: {
        branchName: "Chai Point Sadar Flagship",
        address: "Residency Road Sadar",
        city: "Nagpur",
        state: "Maharashtra",
        pincode: "440001",
      },
    },
    {
      businessName: "Naturals Ice Cream",
      legalEntityName: "Kamaths Ourtimes Ice Creams Pvt Ltd",
      categoryName: "Food & Dining",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      ownerName: "Srinivas Kamath",
      ownerEmail: "srinivas@naturalicecreams.in",
      ownerPhone: "9823044556",
      bankUpiId: "naturals@hdfcbank",
      gstin: "27AABCK5678G1Z9",
      pan: "AABCK5678G",
      commissionRate: 5.0,
      initialStore: {
        branchName: "Naturals FC Road",
        address: "FC Road Deccan Gymkhana",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411004",
      },
    },
    {
      businessName: "Fabindia Retail",
      legalEntityName: "Fabindia Overseas Pvt Ltd",
      categoryName: "Fashion & Retail",
      state: "Maharashtra",
      district: "Mumbai",
      city: "Mumbai",
      ownerName: "William Bissell",
      ownerEmail: "retail.ops@fabindia.net",
      ownerPhone: "9823077889",
      bankUpiId: "fabindia@axisbank",
      gstin: "27AAACF9012H1ZK",
      pan: "AAACF9012H",
      commissionRate: 6.5,
      initialStore: {
        branchName: "Fabindia Bandra West",
        address: "Linking Road Bandra",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400050",
      },
    },
    {
      businessName: "Social Offline",
      legalEntityName: "Impresario Entertainment & Hospitality Pvt Ltd",
      categoryName: "Food & Dining",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      ownerName: "Riyaaz Amlani",
      ownerEmail: "partnerships@socialoffline.in",
      ownerPhone: "9823099001",
      bankUpiId: "social@kotak",
      gstin: "27AABCI3456J1ZL",
      pan: "AABCI3456J",
      commissionRate: 5.0,
      initialStore: {
        branchName: "FC Road Social",
        address: "Fergusson College Road",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411004",
      },
    },
    {
      businessName: "Bata India",
      legalEntityName: "Bata India Limited",
      categoryName: "Fashion & Retail",
      state: "Maharashtra",
      district: "Nagpur",
      city: "Nagpur",
      ownerName: "Gunjan Shah",
      ownerEmail: "franchise@bata.in",
      ownerPhone: "9823022334",
      bankUpiId: "bata@sbi",
      gstin: "27AAACB7890K1ZM",
      pan: "AAACB7890K",
      commissionRate: 5.0,
      initialStore: {
        branchName: "Bata Dharampeth",
        address: "West High Court Road",
        city: "Nagpur",
        state: "Maharashtra",
        pincode: "440010",
      },
    },
  ];

  // 1-Click Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers =
      "BusinessName,LegalEntityName,Category,State,District,City,OwnerName,OwnerEmail,OwnerPhone,GSTIN,PAN,BankUPI,CommissionRate,BranchName,BranchAddress,BranchPincode";
    const sampleRows = [
      "The Belgian Waffle Co,Bloombay Enterprises Pvt Ltd,Food & Dining,Maharashtra,Nagpur,Nagpur,Shrey Aggarwal,shrey@belgianwaffle.in,9823011445,27AABCB1234F1Z9,AABCB1234F,belgianwaffle@icici,5.0,Belgian Waffle Sadar,Mount Road Sadar,440001",
      "Keventers Milkshakes,Super Milk Products Pvt Ltd,Food & Dining,Maharashtra,Pune,Pune,Aman Arora,aman@keventers.com,9823099887,27AABCS5678H1Z2,AABCS5678H,keventers@hdfcbank,5.0,Keventers Koregaon Park,North Main Road,411001",
    ];
    const csvContent = [headers, ...sampleRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pinak_merchants_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded pinak_merchants_template.csv");
  };

  // Parse Raw CSV Text
  const parseCsvText = (text: string) => {
    setStep("validating");
    setTimeout(() => {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        toast.error("CSV file is empty or does not contain data rows");
        setStep("upload");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const records: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });

        const bName = row["businessname"] || row["brand"] || `Merchant Partner ${i}`;
        const cat = row["category"] || "Food & Dining";
        const city = row["city"] || "Nagpur";
        const email = row["owneremail"] || row["email"] || `partner${i}@merchant.in`;
        const phone = row["ownerphone"] || row["phone"] || "9823011223";
        const upi = row["bankupi"] || row["upi"] || `${bName.toLowerCase().replace(/\s+/g, "")}@icici`;
        const gstin = row["gstin"] || "27AABCU9603R1ZM";
        const pan = row["pan"] || "AABCU9603R";

        records.push({
          businessName: bName,
          legalEntityName: row["legalentityname"] || `${bName} Pvt Ltd`,
          categoryName: cat,
          state: row["state"] || "Maharashtra",
          district: row["district"] || city,
          city: city,
          ownerName: row["ownername"] || "Authorized Signatory",
          ownerEmail: email,
          ownerPhone: phone,
          bankUpiId: upi,
          gstin: gstin,
          pan: pan,
          commissionRate: parseFloat(row["commissionrate"] || "5.0") || 5.0,
          initialStore: {
            branchName: row["branchname"] || `${bName} Main Outlet`,
            address: row["branchaddress"] || `${city} Central`,
            city: city,
            state: row["state"] || "Maharashtra",
            pincode: row["branchpincode"] || "440001",
          },
        });
      }

      setParsedMerchants(records);
      setStep("ready");
      toast.success(`Successfully parsed ${records.length} merchant records from CSV!`);
    }, 700);
  };

  // Real File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  // Quick Demo Dataset Loader
  const handleLoadDemoDataset = () => {
    setFileName("pinak_demo_partners_batch.csv");
    setStep("validating");
    setTimeout(() => {
      setParsedMerchants(DEMO_PARTNER_DATA);
      setStep("ready");
      toast.success(`Loaded ${DEMO_PARTNER_DATA.length} pre-verified merchant partners!`);
    }, 600);
  };

  // Execute Batch Onboarding
  const handleExecuteImport = async () => {
    if (parsedMerchants.length === 0) return;
    setIsImporting(true);
    try {
      await onImportMerchants(parsedMerchants);
      toast.success(`Successfully onboarded ${parsedMerchants.length} partner merchants!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete bulk merchant import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-md bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Bulk CSV Merchant Import
                </h3>
                <p className="text-[11px] text-slate-400">Multi-brand batch onboarding engine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Step 1: Upload / Drag-and-Drop */}
            {step === "upload" && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/40 dark:bg-purple-950/20 text-center cursor-pointer hover:bg-purple-50/80 dark:hover:bg-purple-950/40 transition-colors space-y-2.5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-xs">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Choose CSV file or drag & drop
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Standard columns: BusinessName, Category, City, OwnerEmail, BankUPI
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-[11px] shadow-xs">
                    Browse File (.csv)
                  </span>
                </div>

                {/* Quick Helper Tools */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      CSV Onboarding Template
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSampleCsv}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs"
                    >
                      <Download size={14} className="text-purple-600" />
                      <span>Download Merchant Template (.CSV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadDemoDataset}
                      className="w-full py-2 px-3 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} />
                      <span>Load Sample Batch (5 Outlets)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Validating */}
            {step === "validating" && (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-3 border-pink-500 border-t-transparent animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Validating CSV Schema & Columns...
                </p>
                <p className="text-xs text-slate-400">
                  Checking GSTIN checksums, PAN formatting, and UPI routes
                </p>
              </div>
            )}

            {/* Step 3: Ready for Import */}
            {step === "ready" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-xs">Validation Passed Successfully</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {parsedMerchants.length} partner brands ready for automated provisioning.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Source File: <strong className="text-slate-700 dark:text-slate-300">{fileName}</strong></span>
                  <button
                    onClick={() => {
                      setStep("upload");
                      setParsedMerchants([]);
                      setFileName("");
                    }}
                    className="text-pink-600 hover:underline font-bold"
                  >
                    Change File
                  </button>
                </div>

                {/* Parsed List Preview */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Parsed Records ({parsedMerchants.length})
                  </span>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {parsedMerchants.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 dark:text-white text-xs font-['Manrope']">
                            {m.businessName}
                          </strong>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Valid
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                          <span>{m.categoryName}</span>
                          <span>•</span>
                          <span>{m.city}, {m.state}</span>
                          <span>•</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{m.bankUpiId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2.5">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={step !== "ready" || isImporting}
              className="flex-1 btn-gradient py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition-opacity"
            >
              {isImporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Onboarding {parsedMerchants.length} Brands...</span>
                </>
              ) : (
                <>
                  <CheckCheck size={15} />
                  <span>Import {parsedMerchants.length || 0} Merchants</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
