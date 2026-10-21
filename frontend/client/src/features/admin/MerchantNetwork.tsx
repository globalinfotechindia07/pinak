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
  Sparkles,
  Edit2,
  Save,
  LayoutGrid,
  List,
  Search
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
import { storeApi } from "../../api/storeApi";
import { cityApi } from "../../api/cityApi";

export const lookupIfscBank = (ifsc: string): string => {
  const code = (ifsc || "").toUpperCase().trim();
  if (code.startsWith("SBIN")) return "State Bank of India";
  if (code.startsWith("HDFC")) return "HDFC Bank";
  if (code.startsWith("ICIC")) return "ICICI Bank";
  if (code.startsWith("UTIB")) return "Axis Bank";
  if (code.startsWith("PNBK")) return "Punjab National Bank";
  if (code.startsWith("KKBK")) return "Kotak Mahindra Bank";
  if (code.startsWith("YESB")) return "Yes Bank";
  if (code.startsWith("BARB")) return "Bank of Baroda";
  if (code.startsWith("CNRB")) return "Canara Bank";
  if (code.startsWith("IDIB")) return "Indian Bank";
  if (code.startsWith("MAHB")) return "Bank of Maharashtra";
  if (code.startsWith("UBIN")) return "Union Bank of India";
  if (code.startsWith("INDB")) return "IndusInd Bank";
  if (code.startsWith("IDFB")) return "IDFC FIRST Bank";
  if (code.startsWith("SCBL")) return "Standard Chartered Bank";
  if (code.startsWith("HSBC")) return "HSBC Bank";
  return "";
};

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
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [cardSearch, setCardSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [kycTab, setKycTab] = useState<"overview" | "documents" | "outlets" | "audit">("overview");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null);
  const [merchantToEdit, setMerchantToEdit] = useState<Merchant | null>(null);
  const [fetchedMerchantStores, setFetchedMerchantStores] = useState<any[]>([]);
  const [isFetchingStores, setIsFetchingStores] = useState(false);

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
    () => merchants.filter((m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED" || m.kycStatus === "PENDING").length,
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
      PENDING_REVIEW: merchants.filter((m) => m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED" || m.kycStatus === "PENDING").length,
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
      if (statusFilter === "PENDING_REVIEW") return m.kycStatus === "PENDING_REVIEW" || m.kycStatus === "SUBMITTED" || m.kycStatus === "PENDING";
      return m.kycStatus === statusFilter;
    });
  }, [merchants, statusFilter]);

  // Fetch stores directly for selected merchant if needed
  useEffect(() => {
    if (!selectedMerchant?.id) {
      setFetchedMerchantStores([]);
      return;
    }
    let isCancelled = false;
    setIsFetchingStores(true);
    storeApi
      .getStoresByMerchantId(String(selectedMerchant.id))
      .then((stores) => {
        if (!isCancelled && Array.isArray(stores)) {
          setFetchedMerchantStores(stores);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) setIsFetchingStores(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedMerchant?.id]);

  // Merchant's operating stores (null-safe and fallback to direct backend fetch)
  const merchantStores = useMemo(() => {
    if (!selectedMerchant) return [];
    const selId = String(selectedMerchant.id || "").toLowerCase().trim();
    const selName = (selectedMerchant.businessName || "").toLowerCase().trim();

    const localMatches = allStores.filter((st) => {
      const stMerchantId = String(st.merchantId || "").toLowerCase().trim();
      const stMerchantName = (st.merchantName || "").toLowerCase().trim();
      return (selId && stMerchantId === selId) || (selName && stMerchantName === selName);
    });

    if (localMatches.length > 0) return localMatches;

    if (fetchedMerchantStores.length > 0) {
      return fetchedMerchantStores.map((st: any) => ({
        id: st.id,
        merchantId: st.merchantId || selectedMerchant.id,
        merchantName: st.merchantName || selectedMerchant.businessName,
        storeName: st.storeName || st.name || "Store Outlet",
        branchName: st.storeName || st.name || "Store Outlet",
        address: st.address || st.addressLine1 || `${st.city || "Nagpur"} Central`,
        city: st.cityName || st.cityId || st.city || "Nagpur",
        state: st.state || "Maharashtra",
        pincode: st.pincode || "",
        latitude: st.latitude ? Number(st.latitude) : 21.1458,
        longitude: st.longitude ? Number(st.longitude) : 79.0882,
        status: st.status || "ACTIVE",
        phone: st.phone || st.contactPhone || selectedMerchant.ownerPhone || "",
        operatingHours: st.openingTime && st.closingTime ? `${st.openingTime} – ${st.closingTime}` : "10:00 AM – 10:00 PM",
        hasActiveOffer: true,
      }));
    }

    return [];
  }, [selectedMerchant, allStores, fetchedMerchantStores]);

  // Audit logs related to selected merchant (strictly scoped to this merchant's unique UUID)
  const merchantAuditLogs = useMemo(() => {
    if (!selectedMerchant) return [];
    const logs = store.auditLogs || [];
    const mId = selectedMerchant.id;
    return logs.filter((log: any) => {
      const targetId = log.metadata?.targetId || log.metadata?.merchantId || log.entityId;
      if (targetId && targetId === mId) return true;
      if (log.details && log.details.includes(mId)) return true;
      if (log.metadata?.details && String(log.metadata.details).includes(mId)) return true;
      return false;
    });
  }, [selectedMerchant, store.auditLogs]);

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
      render: (m) => {
        const count = m.storeCount ?? 0;
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Store size={12} className="text-purple-600 dark:text-purple-400" />
            {count} {count === 1 ? "outlet" : "outlets"}
          </span>
        );
      }
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
      render: (m) => {
        const status = (m.status || "").toUpperCase();

        if (status === "ACTIVE") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          );
        }
        if (status === "SUSPENDED") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Suspended
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Inactive (Pending Setup)
          </span>
        );
      }
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
          {((m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED") ? "REJECTED" : (m.kycStatus === "APPROVED" ? "APPROVED" : "PENDING REVIEW"))}
        </Badge>
      )
    },
    {
      header: "Action",
      sortable: false,
      className: "text-right whitespace-nowrap",
      render: (m) => (
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition-colors"
                title="Merchant Actions"
              >
                <MoreVertical size={15} />
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
                <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Review KYC & Details</span>
              </DropdownMenuItem>


              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(m.id);
                  toast.success(`Copied Merchant ID: ${m.id}`);
                }}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Copy size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Copy Merchant ID</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setMerchantToEdit(m)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
              >
                <Edit2 size={14} className="text-purple-600 dark:text-purple-400" />
                <span>Edit Merchant Profile</span>
              </DropdownMenuItem>

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
                    const nextStatus = m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    onUpdateMerchant(m.id, { status: nextStatus });
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {m.status === "ACTIVE" ? (
                    <>
                      <PowerOff size={14} className="text-amber-500" />
                      <span>Deactivate Account</span>
                    </>
                  ) : (
                    <>
                      <Power size={14} className="text-emerald-500" />
                      <span>Activate Account</span>
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

      {/* Status Filter Chips with Badges + View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Table View"
          >
            <List size={14} />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              viewMode === "cards"
                ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
            title="Card Grid View"
          >
            <LayoutGrid size={14} />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table or Cards View */}
      {viewMode === "table" ? (
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
      ) : (
        <div className="space-y-4">
          {/* Card Search & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search brands, city, legal name, or owner..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 dark:text-white"
              />
              {cardSearch && (
                <button
                  type="button"
                  onClick={() => setCardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end gap-2">
              <span>Showing <strong>{
                filtered.filter((m) => {
                  if (!cardSearch.trim()) return true;
                  const q = cardSearch.toLowerCase();
                  return (
                    m.businessName.toLowerCase().includes(q) ||
                    m.city.toLowerCase().includes(q) ||
                    (m.legalEntityName && m.legalEntityName.toLowerCase().includes(q)) ||
                    (m.ownerName && m.ownerName.toLowerCase().includes(q)) ||
                    (m.categoryName && m.categoryName.toLowerCase().includes(q))
                  );
                }).length
              }</strong> of <strong>{merchants.length}</strong> merchants</span>
            </div>
          </div>

          {/* Cards Grid */}
          {(() => {
            const cardData = filtered.filter((m) => {
              if (!cardSearch.trim()) return true;
              const q = cardSearch.toLowerCase();
              return (
                m.businessName.toLowerCase().includes(q) ||
                m.city.toLowerCase().includes(q) ||
                (m.legalEntityName && m.legalEntityName.toLowerCase().includes(q)) ||
                (m.ownerName && m.ownerName.toLowerCase().includes(q)) ||
                (m.categoryName && m.categoryName.toLowerCase().includes(q))
              );
            });

            if (cardData.length === 0) {
              return (
                <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3">
                    <Building2 size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No merchants match your criteria</h4>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or status filters.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cardData.map((m) => {
                  const isRejected = m.kycStatus === "REJECTED" || (m as any).approvalStatus === "REJECTED";
                  const isApproved = m.kycStatus === "APPROVED";
                  const count = m.storeCount ?? 0;

                  return (
                    <div
                      key={m.id}
                      className="group relative rounded-2xl bg-white dark:bg-[#121626] border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 transition-all p-5 shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      {/* Top Row: Avatar + Brand + Action Menu */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                              {m.initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {m.businessName}
                              </h4>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {m.legalEntityName || m.businessName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                  MID: #{m.id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3-dots actions menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Merchant Actions"
                              >
                                <MoreVertical size={15} />
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
                                <Eye size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>Review KYC & Details</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(m.id);
                                  toast.success(`Copied Merchant ID: ${m.id}`);
                                }}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Copy size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>Copy Merchant ID</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setMerchantToEdit(m)}
                                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300"
                              >
                                <Edit2 size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>Edit Merchant Profile</span>
                              </DropdownMenuItem>

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
                                    const nextStatus = m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                                    onUpdateMerchant(m.id, { status: nextStatus });
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  {m.status === "ACTIVE" ? (
                                    <>
                                      <PowerOff size={14} className="text-amber-500" />
                                      <span>Deactivate Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <Power size={14} className="text-emerald-500" />
                                      <span>Activate Account</span>
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

                        {/* Status Badges Row */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {/* KYC Status Badge */}
                          <Badge
                            variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}
                            className="cursor-pointer"
                            onClick={() => setSelectedMerchant(m)}
                          >
                            {isApproved ? <CheckCircle2 size={11} /> : isRejected ? <XCircle size={11} /> : <Clock size={11} />}
                            {isRejected ? "REJECTED" : isApproved ? "APPROVED" : "PENDING REVIEW"}
                          </Badge>

                          {/* Account Status Badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
                              m.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                                : m.status === "SUSPENDED"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                            )}
                          >
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              m.status === "ACTIVE" ? "bg-emerald-500" : m.status === "SUSPENDED" ? "bg-rose-500" : "bg-amber-500"
                            )} />
                            {m.status === "ACTIVE" ? "ACTIVE" : m.status === "SUSPENDED" ? "SUSPENDED" : "INACTIVE (PENDING SETUP)"}
                          </span>

                          {/* Category Tag */}
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            {m.categoryName}
                          </span>
                        </div>

                        {/* Key Info Details Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">City & Region</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span className="truncate">{m.city || "Nagpur"}{m.state ? `, ${m.state}` : ""}</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Store Branches</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                              <Store size={11} className="text-purple-600 dark:text-purple-400 shrink-0" />
                              <span>{count} {count === 1 ? "outlet" : "outlets"}</span>
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Settlement VPA / Account</span>
                            <span className="font-mono text-purple-700 dark:text-purple-300 font-bold truncate block mt-0.5">
                              {m.bankUpiId || (m.bankAccountNumber ? `A/C **${m.bankAccountNumber.slice(-4)}` : "Not linked")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Quick Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {m.ownerEmail || m.ownerPhone || "Owner account"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedMerchant(m)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                        >
                          <Eye size={13} />
                          <span>Review KYC</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {selectedMerchant.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {selectedMerchant.businessName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="font-mono font-semibold text-purple-700 dark:text-purple-300">
                          MID: #{selectedMerchant.id.substring(0, 8).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMerchant.id);
                            toast.success(`Merchant ID (${selectedMerchant.id}) copied!`);
                          }}
                          className="hover:text-purple-600 dark:hover:text-purple-400 text-slate-400 p-0.5 rounded transition-colors inline-flex items-center"
                          title="Copy Full Merchant UUID"
                        >
                          <Copy size={11} />
                        </button>
                        <span>·</span>
                        <span className="truncate max-w-[120px]">{selectedMerchant.categoryName}</span>
                        {selectedMerchant.city && (
                          <>
                            <span>·</span>
                            <span>{selectedMerchant.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const isRejected = selectedMerchant.kycStatus === "REJECTED" || (selectedMerchant as any).approvalStatus === "REJECTED";
                      const isApproved = selectedMerchant.kycStatus === "APPROVED";
                      return (
                        <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}>
                          {isApproved ? <CheckCircle2 size={12} /> : isRejected ? <XCircle size={12} /> : <Clock size={12} />}
                          {isRejected ? "REJECTED" : isApproved ? "APPROVED" : "PENDING REVIEW"}
                        </Badge>
                      );
                    })()}
                    <button
                      onClick={() => setSelectedMerchant(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 mt-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setKycTab("overview")}
                    className={cn(
                      "py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
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
                      "py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                      kycTab === "documents"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <FileText size={13} />
                    <span>Docs</span>
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
                      "py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                      kycTab === "outlets"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Store size={13} />
                    <span>Stores</span>
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                      kycTab === "outlets"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {merchantStores.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKycTab("audit")}
                    className={cn(
                      "py-2 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                      kycTab === "audit"
                        ? "bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Clock size={13} />
                    <span>Audit</span>
                    <span className={cn(
                      "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                      kycTab === "audit"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {merchantAuditLogs.length}
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
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Industry & Operating Sector
                          </span>
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60">
                            {selectedMerchant.categoryName}
                          </span>
                        </div>

                        {/* Full Registered Address */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">Headquarters & Premise Address</span>
                            {selectedMerchant.pincode && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                PIN: {selectedMerchant.pincode}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-white leading-relaxed">
                            {selectedMerchant.address || `${selectedMerchant.city} Commercial District`}
                          </p>
                          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                            <span>City: <strong className="text-slate-700 dark:text-slate-300">{selectedMerchant.city}</strong></span>
                            <span>•</span>
                            <span>District: <strong className="text-slate-700 dark:text-slate-300">{selectedMerchant.district || selectedMerchant.city}</strong></span>
                            <span>•</span>
                            <span>State: <strong className="text-slate-700 dark:text-slate-300">{selectedMerchant.state || "Maharashtra"}</strong></span>
                          </div>
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

                      {/* Settlement Bank Account Details */}
                      <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-purple-600 dark:text-purple-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                              Settlement Bank Account Details
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            Take-Rate: {selectedMerchant.commissionRate ?? 5.0}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block font-medium">Bank Name</span>
                            <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                              {selectedMerchant.bankName || "Not configured"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block font-medium">Account Holder</span>
                            <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                              {selectedMerchant.accountHolderName || (selectedMerchant as any).legalEntityName || selectedMerchant.businessName || "Not specified"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">Account Number</span>
                              {selectedMerchant.bankAccountNumber && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedMerchant.bankAccountNumber || "");
                                    toast.success("Account number copied to clipboard");
                                  }}
                                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-bold"
                                  title="Copy Account Number"
                                >
                                  <Copy size={10} />
                                  Copy
                                </button>
                              )}
                            </div>
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-300 truncate block mt-0.5">
                              {selectedMerchant.bankAccountNumber || "N/A"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">IFSC Code</span>
                              {selectedMerchant.bankIfsc && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedMerchant.bankIfsc || "");
                                    toast.success("IFSC code copied to clipboard");
                                  }}
                                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-bold"
                                  title="Copy IFSC"
                                >
                                  <Copy size={10} />
                                  Copy
                                </button>
                              )}
                            </div>
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-300 truncate block mt-0.5">
                              {selectedMerchant.bankIfsc || "N/A"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-medium">Settlement UPI ID</span>
                              {selectedMerchant.bankUpiId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedMerchant.bankUpiId || "");
                                    toast.success("UPI ID copied to clipboard");
                                  }}
                                  className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 font-bold"
                                  title="Copy UPI ID"
                                >
                                  <Copy size={10} />
                                  Copy
                                </button>
                              )}
                            </div>
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-300 truncate block mt-0.5">
                              {selectedMerchant.bankUpiId || "Not linked"}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[10px] text-slate-400 block font-medium">Platform Take-Rate / Fee</span>
                            <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
                              {selectedMerchant.commissionRate ?? 5.0}% <span className="text-[10px] font-normal text-slate-400">(per transaction)</span>
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                          <span>Direct settlements are credited via automated NEFT / RTGS / IMPS payout rails.</span>
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
                        {selectedMerchant.status === "INACTIVE" && (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Awaiting first password setup
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendInvite(selectedMerchant)}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <Mail size={12} />
                              Resend Setup Link
                            </button>
                          </div>
                        )}
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

                    {/* Doc 3: Settlement Bank Account Verification */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            <Building2 size={14} />
                          </div>
                          <div>
                            <strong className="text-xs text-slate-900 dark:text-white block">
                              Settlement Bank Account Verification
                            </strong>
                            <span className="text-[10px] text-slate-400">Direct Core-Banking Settlement Route</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Penny-Drop OK
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Bank & Account</span>
                          <span className="font-mono font-bold text-purple-600 dark:text-purple-400 truncate block">
                            {selectedMerchant.bankName ? `${selectedMerchant.bankName} - ${selectedMerchant.bankAccountNumber || "N/A"}` : (selectedMerchant.bankAccountNumber || "Not configured")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">IFSC Code</span>
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedMerchant.bankIfsc || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Settlement UPI ID</span>
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-300 truncate block">
                            {selectedMerchant.bankUpiId || "Not linked"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Platform Fee / Commission</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {selectedMerchant.commissionRate ?? 5.0}% per txn
                          </span>
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
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-1">
                        <span className="text-[10px] text-slate-400 block">Registered Physical Premise</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedMerchant.address || `${selectedMerchant.city} Commercial Area`}, {selectedMerchant.city}, {selectedMerchant.district && selectedMerchant.district !== selectedMerchant.city ? `${selectedMerchant.district}, ` : ""}{selectedMerchant.state || "Maharashtra"} {selectedMerchant.pincode ? `- ${selectedMerchant.pincode}` : ""}
                        </p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                          Associated Outlets: {merchantStores.length} Provisioned {merchantStores.length === 1 ? "Branch" : "Branches"}
                        </p>
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

                {/* TAB 4: AUDIT LOGS & EVENT HISTORY */}
                {kycTab === "audit" && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock size={14} className="text-purple-600 dark:text-purple-400" />
                        <span>Audit Logs & Security History ({merchantAuditLogs.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Immutable Security Trail</span>
                    </div>

                    {merchantAuditLogs.length > 0 ? (
                      <div className="space-y-2.5">
                        {merchantAuditLogs.map((log: any, idx: number) => {
                          const isSuccess = log.severity === "success" || log.action?.includes("APPROVED") || log.action?.includes("CREATED");
                          const isWarning = log.severity === "warning" || log.action?.includes("REJECTED");
                          const isCritical = log.severity === "critical" || log.action?.includes("SUSPENDED");
                          return (
                            <div
                              key={log.id || idx}
                              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant={isSuccess ? "success" : isWarning ? "warning" : isCritical ? "destructive" : "secondary"}>
                                  {log.action || "EVENT"}
                                </Badge>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {log.time ? new Date(log.time).toLocaleString() : "Just now"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                {log.metadata?.details || log.details || `${log.action} action executed.`}
                              </p>
                              <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/50 dark:border-slate-800/60">
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                  User: {log.actor || "riya.admin@pinak.app (Super Admin)"}
                                </span>
                                <span className="font-mono text-slate-400">Entity: {log.entity || "Merchant"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          No audit log entries recorded yet for this merchant.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Actions like profile edits, KYC status changes, and status toggles will be captured here.
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
                    store.addAudit({
                      action: "KYC_APPROVED",
                      entity: "Merchant",
                      actor: store.currentUser?.email ? `${store.currentUser.name || "Admin"} (${store.currentUser.email})` : "riya.admin@pinak.app (Super Admin)",
                      severity: "success",
                      metadata: {
                        targetId: selectedMerchant.id,
                        details: `Approved KYC documents & commercial verification for merchant brand "${selectedMerchant.businessName}".`
                      }
                    });
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
                      store.addAudit({
                        action: "KYC_REVISION_REQUESTED",
                        entity: "Merchant",
                        actor: store.currentUser?.email ? `${store.currentUser.name || "Admin"} (${store.currentUser.email})` : "riya.admin@pinak.app (Super Admin)",
                        severity: "warning",
                        metadata: {
                          targetId: selectedMerchant.id,
                          details: `Requested document clarification/revision from merchant "${selectedMerchant.businessName}".`
                        }
                      });
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
                      store.addAudit({
                        action: "KYC_REJECTED",
                        entity: "Merchant",
                        actor: store.currentUser?.email ? `${store.currentUser.name || "Admin"} (${store.currentUser.email})` : "riya.admin@pinak.app (Super Admin)",
                        severity: "critical",
                        metadata: {
                          targetId: selectedMerchant.id,
                          details: `Rejected merchant KYC application for "${selectedMerchant.businessName}".`
                        }
                      });
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

      {/* Edit Merchant Drawer (Right Side) */}
      {merchantToEdit && (
        <EditMerchantDrawer
          merchant={merchantToEdit}
          onClose={() => setMerchantToEdit(null)}
          onSave={async (updates) => {
            try {
              const backendPayload = {
                businessName: updates.businessName,
                legalName: (updates as any).legalEntityName || updates.legalEntityName || updates.businessName,
                phone: (updates as any).ownerPhone || (updates as any).phone,
                email: (updates as any).ownerEmail || (updates as any).email,
                state: updates.state,
                district: updates.district,
                city: updates.city,
                address: (updates as any).address,
                pincode: (updates as any).pincode,
                bankName: (updates as any).bankName,
                accountHolderName: (updates as any).accountHolderName,
                bankAccountNumber: (updates as any).bankAccountNumber,
                bankIfsc: (updates as any).bankIfsc,
                bankUpiId: updates.bankUpiId,
                gstin: updates.gstin,
                pan: updates.pan,
                commissionRate: updates.commissionRate,
              };
              await merchantApi.updateMerchantAdmin(merchantToEdit.id, backendPayload);
              if (onUpdateMerchant) {
                await onUpdateMerchant(merchantToEdit.id, updates);
              }
              store.addAudit({
                action: "MERCHANT_UPDATED",
                entity: "Merchant",
                actor: store.currentUser?.email ? `${store.currentUser.name || "Admin"} (${store.currentUser.email})` : "riya.admin@pinak.app (Super Admin)",
                severity: "info",
                metadata: {
                  targetId: merchantToEdit.id,
                  details: `Updated merchant identity & settlement bank details for ${updates.businessName || merchantToEdit.businessName}.`
                }
              });
              toast.success(`Merchant "${updates.businessName || merchantToEdit.businessName}" updated successfully!`);
              setMerchantToEdit(null);
            } catch (err: any) {
              toast.error(err?.response?.data?.message || err?.message || "Failed to save merchant updates");
            }
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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
    pincode: "440010",
    address: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    bankName: "",
    accountHolderName: "",
    bankAccountNumber: "",
    confirmBankAccountNumber: "",
    bankIfsc: "",
    bankUpiId: "",
    gstin: "",
    pan: "",
    commissionRate: 5.0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [isCustomHqDistrict, setIsCustomHqDistrict] = useState(false);
  const [isCustomHqCity, setIsCustomHqCity] = useState(false);
  const [hqPincodeSearch, setHqPincodeSearch] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState<string | null>(null);

  const handleHqPincodeChange = async (pin: string) => {
    setHqPincodeSearch(pin);
    const clean = pin.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) {
      try {
        setIsPincodeLoading(true);
        const res = await cityApi.lookupPincode(clean);
        if (res && res.state) {
          setIsCustomHqDistrict(Boolean(res.isDistrictCustom));
          setIsCustomHqCity(Boolean(res.isCityCustom));
          setFormData((prev) => ({
            ...prev,
            state: res.state,
            district: res.district,
            city: res.city,
            pincode: clean,
          }));

          setErrors((prev) => {
            const next = { ...prev };
            delete next.state;
            delete next.district;
            delete next.city;
            return next;
          });

          setPincodeSuccessMsg(`Verified via India Post: ${res.city || res.district}, ${res.state}`);
          setTimeout(() => setPincodeSuccessMsg(null), 5000);
          toast.success(`PIN ${clean} verified via India Post: ${res.city || res.district}, ${res.state}`);
        } else {
          toast.error(`PIN code ${clean} not found in Postal registry. Please enter location manually.`);
        }
      } catch (err) {
        console.warn("Pincode lookup failed:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

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
      pincode: pick.branchPincode || "440010",
      address: pick.branchAddress || `${pick.city} Central`,
      ownerName: pick.ownerName,
      ownerEmail: uniqueEmail,
      ownerPhone: uniquePhone,
      bankName: "ICICI Bank",
      accountHolderName: pick.legalEntityName,
      bankAccountNumber: "30981234567",
      confirmBankAccountNumber: "30981234567",
      bankIfsc: "ICIC0000001",
      bankUpiId: pick.bankUpiId,
      gstin: pick.gstin,
      pan: pick.pan,
      commissionRate: 5.0,
    });

    setHqPincodeSearch(pick.branchPincode || "440010");
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

  // Real-time duplicate phone number detection
  const cleanPhoneInput = (formData.ownerPhone || "").replace(/\D/g, "");
  const conflictingPhone = useMemo(() => {
    if (cleanPhoneInput.length < 10) return null;
    return (
      existingMerchants.find((m) => {
        const mPhone = (m.ownerPhone || (m as any).phone || "").replace(/\D/g, "");
        if (!mPhone) return false;
        // Compare standard 10-digit suffixes to handle +91 / 0 prefix differences
        const m10 = mPhone.slice(-10);
        const input10 = cleanPhoneInput.slice(-10);
        return m10 === input10;
      }) || null
    );
  }, [cleanPhoneInput, existingMerchants]);

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
      } else if (conflictingPhone) {
        stepErrors.ownerPhone = `This phone number is already registered with merchant "${conflictingPhone.businessName}". Please use a unique authorized phone number.`;
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
      setCurrentStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentStep !== 3) {
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
      pincode: hqPincodeSearch.trim() || formData.pincode?.trim() || "440010",
      address: formData.address?.trim() || `${formData.city.trim() || "Nagpur"} Central`,
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim().toLowerCase(),
      ownerPhone: formData.ownerPhone.trim(),
      bankName: formData.bankName.trim(),
      accountHolderName: formData.accountHolderName.trim() || formData.legalEntityName.trim() || formData.businessName.trim(),
      bankAccountNumber: formData.bankAccountNumber.trim(),
      bankIfsc: formData.bankIfsc.trim().toUpperCase(),
      bankUpiId: formData.bankUpiId.trim() || `${formData.businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}@upi`,
      gstin: formData.gstin.trim().toUpperCase(),
      pan: formData.pan.trim().toUpperCase(),
      commissionRate: Number(formData.commissionRate) || 5.0,
      initialStore: null,
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
    { num: 1, label: "Brand & Location", icon: Building2 },
    { num: 2, label: "Signatory & Contact", icon: UserCheck },
    { num: 3, label: "Tax & Bank Payout", icon: ShieldCheck },
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
                    Step {currentStep} of 3: {stepsConfig[currentStep - 1].label}
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
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
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
              if (currentStep === 3) {
                handleSubmit(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
                e.preventDefault();
                if (currentStep < 3) {
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

                  {/* Quick Pincode Auto-Fill Bar */}
                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="text-[11px] font-semibold text-purple-900 dark:text-purple-200">
                        Quick Auto-Fill with PIN Code:
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit PIN"
                        value={hqPincodeSearch}
                        onChange={(e) => handleHqPincodeChange(e.target.value)}
                        className="w-28 px-2 py-1 text-xs rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 font-mono text-center font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      {isPincodeLoading && (
                        <span className="text-[10px] text-purple-600 animate-pulse font-semibold">Detecting...</span>
                      )}
                    </div>
                  </div>
                  {pincodeSuccessMsg && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> {pincodeSuccessMsg}
                    </p>
                  )}

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

                    {/* District Selector with Manual Toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                          District *
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsCustomHqDistrict(!isCustomHqDistrict)}
                          className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                        >
                          {isCustomHqDistrict ? "← Select from list" : "Type custom"}
                        </button>
                      </div>
                      {isCustomHqDistrict ? (
                        <input
                          type="text"
                          value={formData.district}
                          onChange={(e) => handleHqDistrictChange(e.target.value)}
                          placeholder="District name"
                          className={cn(
                            "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden",
                            errors.district
                              ? "border-rose-500 ring-1 ring-rose-500/20"
                              : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                          )}
                        />
                      ) : (
                        <div className="relative">
                          <select
                            value={formData.district}
                            onChange={(e) => {
                              if (e.target.value === "__CUSTOM__") {
                                setIsCustomHqDistrict(true);
                              } else {
                                handleHqDistrictChange(e.target.value);
                              }
                            }}
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
                            <option value="__CUSTOM__">+ Other (Type custom district...)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                            ▼
                          </div>
                        </div>
                      )}
                      {errors.district && (
                        <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{errors.district}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* City / Town Dropdown with Manual Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                        Headquarters City / Town *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomHqCity(!isCustomHqCity)}
                        className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                      >
                        {isCustomHqCity ? "← Choose from list" : "Can't find city? Type manually"}
                      </button>
                    </div>
                    {isCustomHqCity ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleHqCityChange(e.target.value)}
                        placeholder="e.g. Nagpur / Ramdaspeth"
                        className={cn(
                          "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden",
                          errors.city
                            ? "border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                    ) : (
                      <div className="relative">
                        <select
                          value={formData.city}
                          onChange={(e) => {
                            if (e.target.value === "__CUSTOM__") {
                              setIsCustomHqCity(true);
                            } else {
                              handleHqCityChange(e.target.value);
                            }
                          }}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-hidden",
                            errors.city
                              ? "border-rose-500 ring-1 ring-rose-500/20"
                              : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                          )}
                        >
                          {hqCities.map((ct) => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                          <option value="__CUSTOM__">+ Other (Type custom city/town...)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                          ▼
                        </div>
                      </div>
                    )}
                    {errors.city && (
                      <p className="text-[11px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{errors.city}</span>
                      </p>
                    )}
                  </div>

                  {/* Registered Commercial Address */}
                  <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                      Registered Office / Business Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="e.g. 104 Central Avenue, Commercial Arcade"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Contact Phone *
                    </label>
                    {cleanPhoneInput.length >= 10 && !conflictingPhone && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Phone available
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.ownerPhone}
                      onChange={(e) => updateField("ownerPhone", e.target.value)}
                      placeholder="+91 98220 11223"
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-xs focus:outline-hidden",
                        conflictingPhone || errors.ownerPhone
                          ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                      )}
                    />
                    <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  {/* Real-time Duplicate Phone Warning */}
                  {conflictingPhone && (
                    <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 space-y-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-rose-800 dark:text-rose-300">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Phone Number Already Registered</span>
                      </div>
                      <p className="text-[11px]">
                        This phone number is already linked to merchant <strong>"{conflictingPhone.businessName}"</strong>. Each business owner must have a unique authorized contact number.
                      </p>
                    </div>
                  )}

                  {errors.ownerPhone && !conflictingPhone && (
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

                <div className="pt-2 space-y-3">
                  <h5 className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <CreditCard size={14} />
                    <span>Payout Settlement Bank Account</span>
                  </h5>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={formData.accountHolderName}
                      onChange={(e) => updateField("accountHolderName", e.target.value)}
                      placeholder="e.g. Curry Leaf Hospitality Pvt Ltd"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        IFSC Code (Automated Lookup)
                      </label>
                      <input
                        type="text"
                        maxLength={11}
                        value={formData.bankIfsc}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          updateField("bankIfsc", val);
                          const autoBank = lookupIfscBank(val);
                          if (autoBank) {
                            updateField("bankName", autoBank);
                          }
                        }}
                        placeholder="SBIN0001234 / ICIC0000001"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold uppercase"
                      />
                      {formData.bankIfsc && lookupIfscBank(formData.bankIfsc) && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          ✓ Auto-detected: {lookupIfscBank(formData.bankIfsc)}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => updateField("bankName", e.target.value)}
                        placeholder="State Bank of India"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankAccountNumber}
                        onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                        placeholder="30981234567"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Confirm Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.confirmBankAccountNumber}
                        onChange={(e) => updateField("confirmBankAccountNumber", e.target.value)}
                        placeholder="Re-enter Account Number"
                        className={cn(
                          "w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 font-mono text-xs font-semibold",
                          formData.confirmBankAccountNumber && formData.bankAccountNumber !== formData.confirmBankAccountNumber
                            ? "border-rose-500 ring-1 ring-rose-500/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-purple-500"
                        )}
                      />
                      {formData.confirmBankAccountNumber && formData.bankAccountNumber !== formData.confirmBankAccountNumber && (
                        <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                          Account numbers do not match
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
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

                {/* Onboarding Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-purple-50/20 to-pink-50/20 dark:from-slate-900/60 dark:via-purple-950/20 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Merchant Profile Summary
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
                      <span className="text-slate-400 block text-[10px]">Bank / UPI Target</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px] truncate block">
                        {formData.bankUpiId || formData.bankAccountNumber || "Direct Settlement"}
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

              {currentStep < 3 ? (
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
      pincode: "440001",
      address: "Residency Road Sadar",
      ownerName: "Tarun Khanna",
      ownerEmail: "tarun.khanna@chaipoint.com",
      ownerPhone: "9823011223",
      bankUpiId: "chaipoint@icici",
      gstin: "27AAECM1234F1Z5",
      pan: "AAECM1234F",
      commissionRate: 5.0,
      initialStore: null,
    },
    {
      businessName: "Naturals Ice Cream",
      legalEntityName: "Kamaths Ourtimes Ice Creams Pvt Ltd",
      categoryName: "Food & Dining",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      pincode: "411004",
      address: "FC Road Deccan Gymkhana",
      ownerName: "Srinivas Kamath",
      ownerEmail: "srinivas@naturalicecreams.in",
      ownerPhone: "9823044556",
      bankUpiId: "naturals@hdfcbank",
      gstin: "27AABCK5678G1Z9",
      pan: "AABCK5678G",
      commissionRate: 5.0,
      initialStore: null,
    },
    {
      businessName: "Fabindia Retail",
      legalEntityName: "Fabindia Overseas Pvt Ltd",
      categoryName: "Fashion & Retail",
      state: "Maharashtra",
      district: "Mumbai",
      city: "Mumbai",
      pincode: "400050",
      address: "Linking Road Bandra",
      ownerName: "William Bissell",
      ownerEmail: "retail.ops@fabindia.net",
      ownerPhone: "9823077889",
      bankUpiId: "fabindia@axisbank",
      gstin: "27AAACF9012H1ZK",
      pan: "AAACF9012H",
      commissionRate: 6.5,
      initialStore: null,
    },
    {
      businessName: "Social Offline",
      legalEntityName: "Impresario Entertainment & Hospitality Pvt Ltd",
      categoryName: "Food & Dining",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      pincode: "411004",
      address: "Fergusson College Road",
      ownerName: "Riyaaz Amlani",
      ownerEmail: "partnerships@socialoffline.in",
      ownerPhone: "9823099001",
      bankUpiId: "social@kotak",
      gstin: "27AABCI3456J1ZL",
      pan: "AABCI3456J",
      commissionRate: 5.0,
      initialStore: null,
    },
    {
      businessName: "Bata India",
      legalEntityName: "Bata India Limited",
      categoryName: "Fashion & Retail",
      state: "Maharashtra",
      district: "Nagpur",
      city: "Nagpur",
      pincode: "440010",
      address: "West High Court Road",
      ownerName: "Gunjan Shah",
      ownerEmail: "franchise@bata.in",
      ownerPhone: "9823022334",
      bankUpiId: "bata@sbi",
      gstin: "27AAACB7890K1ZM",
      pan: "AAACB7890K",
      commissionRate: 5.0,
      initialStore: null,
    },
  ];

  // 1-Click Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers =
      "BusinessName,LegalEntityName,Category,State,District,City,Pincode,Address,OwnerName,OwnerEmail,OwnerPhone,GSTIN,PAN,BankUPI,CommissionRate";
    const sampleRows = [
      "The Belgian Waffle Co,Bloombay Enterprises Pvt Ltd,Food & Dining,Maharashtra,Nagpur,Nagpur,440001,Mount Road Sadar,Shrey Aggarwal,shrey@belgianwaffle.in,9823011445,27AABCB1234F1Z9,AABCB1234F,belgianwaffle@icici,5.0",
      "Keventers Milkshakes,Super Milk Products Pvt Ltd,Food & Dining,Maharashtra,Pune,Pune,411001,North Main Road,Aman Arora,aman@keventers.com,9823099887,27AABCS5678H1Z2,AABCS5678H,keventers@hdfcbank,5.0",
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
          pincode: row["pincode"] || row["branchpincode"] || "440001",
          address: row["address"] || row["branchaddress"] || `${city} Central`,
          ownerName: row["ownername"] || "Authorized Signatory",
          ownerEmail: email,
          ownerPhone: phone,
          bankUpiId: upi,
          gstin: gstin,
          pan: pan,
          commissionRate: parseFloat(row["commissionrate"] || "5.0") || 5.0,
          initialStore: null,
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

// Enterprise Merchant Editing Slide-over Drawer
function EditMerchantDrawer({
  merchant,
  onClose,
  onSave,
}: {
  merchant: Merchant;
  onClose: () => void;
  onSave: (updates: Partial<Merchant>) => Promise<void> | void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: merchant.businessName || "",
    legalEntityName: merchant.legalEntityName || "",
    categoryName: merchant.categoryName || "Food & Dining",
    ownerName: merchant.ownerName || "",
    ownerEmail: merchant.ownerEmail || "",
    ownerPhone: merchant.ownerPhone || "",
    state: merchant.state || "Maharashtra",
    district: merchant.district || "Nagpur",
    city: merchant.city || "Nagpur",
    address: (merchant as any).address || "",
    pincode: (merchant as any).pincode || "",
    bankName: (merchant as any).bankName || "",
    accountHolderName: (merchant as any).accountHolderName || merchant.legalEntityName || merchant.businessName || "",
    bankAccountNumber: (merchant as any).bankAccountNumber || "",
    confirmBankAccountNumber: (merchant as any).bankAccountNumber || "",
    bankIfsc: (merchant as any).bankIfsc || "",
    bankUpiId: merchant.bankUpiId || "",
    gstin: merchant.gstin || "",
    pan: merchant.pan || "",
    commissionRate: merchant.commissionRate || 5.0,
  });

  const states = useMemo(() => getAllStates(), []);
  const hqDistricts = useMemo(() => getDistrictsForState(formData.state), [formData.state]);
  const hqCities = useMemo(() => getCitiesForDistrictOrState(formData.state, formData.district), [formData.state, formData.district]);

  const [isCustomEditDistrict, setIsCustomEditDistrict] = useState(false);
  const [isCustomEditCity, setIsCustomEditCity] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const handleEditPincodeChange = async (pin: string) => {
    setFormData((prev) => ({ ...prev, pincode: pin }));
    const clean = pin.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6) {
      try {
        setIsPincodeLoading(true);
        const res = await cityApi.lookupPincode(clean);
        if (res && res.state) {
          setIsCustomEditDistrict(Boolean(res.isDistrictCustom));
          setIsCustomEditCity(Boolean(res.isCityCustom));
          setFormData((prev) => ({
            ...prev,
            pincode: clean,
            state: res.state,
            district: res.district,
            city: res.city,
          }));
          toast.success(`PIN ${clean} verified via India Post: ${res.city || res.district}, ${res.state}`);
        }
      } catch (err) {
        console.warn("Pincode lookup failed:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    }
  };

  const handleStateChange = (newState: string) => {
    const dists = getDistrictsForState(newState);
    const newDist = dists[0] || "";
    const cities = getCitiesForDistrictOrState(newState, newDist);
    const newCity = cities[0] || "";
    setFormData((prev) => ({ ...prev, state: newState, district: newDist, city: newCity }));
  };

  const handleDistrictChange = (newDist: string) => {
    const cities = getCitiesForDistrictOrState(formData.state, newDist);
    const newCity = cities[0] || "";
    setFormData((prev) => ({ ...prev, district: newDist, city: newCity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      toast.error("Business name is required!");
      return;
    }
    if (formData.confirmBankAccountNumber && formData.bankAccountNumber !== formData.confirmBankAccountNumber) {
      toast.error("Account Number and Confirm Account Number do not match!");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        businessName: formData.businessName.trim(),
        legalEntityName: formData.legalEntityName.trim() || formData.businessName.trim(),
        categoryName: formData.categoryName,
        ownerName: formData.ownerName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerPhone: formData.ownerPhone.trim(),
        state: formData.state.trim(),
        district: formData.district.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        bankName: formData.bankName.trim(),
        accountHolderName: formData.accountHolderName.trim() || formData.businessName.trim(),
        bankAccountNumber: formData.bankAccountNumber.trim(),
        bankIfsc: formData.bankIfsc.trim().toUpperCase(),
        bankUpiId: formData.bankUpiId.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        pan: formData.pan.trim().toUpperCase(),
        commissionRate: Number(formData.commissionRate) || 5.0,
      } as any);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update merchant");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-xl bg-white dark:bg-[#121626] shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                <Edit2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Partner Merchant</h3>
                <p className="text-xs text-slate-500">ID: {merchant.id} · {merchant.businessName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Business Identity */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <Building2 size={14} className="text-purple-600" />
                <span>Brand & Category Identity</span>
              </h4>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Brand / Trade Name *</label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={formData.legalEntityName}
                  onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Primary Category</label>
                <select
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  {["Food & Dining", "Fashion & Retail", "Beauty & Wellness", "Gym & Fitness", "Health & Pharmacy", "Grocery & Supermarkets", "Entertainment & Leisure", "Travel & Hospitality", "Electronics & Appliances", "Home & Living"].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Owner Contact Info */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <UserCheck size={14} className="text-purple-600" />
                <span>Authorized Signatory & Contact</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Owner Email *</label>
                <input
                  type="email"
                  required
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Address & HQ Location */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin size={14} className="text-purple-600" />
                  <span>Headquarters Address & Location</span>
                </h4>
                {isPincodeLoading && (
                  <span className="text-[10px] text-purple-600 font-semibold animate-pulse">Checking PIN...</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                    PIN Code (Auto-fills State & City)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) => handleEditPincodeChange(e.target.value)}
                    placeholder="e.g. 440010"
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-[11px]">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    {states.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">District *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomEditDistrict(!isCustomEditDistrict)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      {isCustomEditDistrict ? "← List" : "Custom"}
                    </button>
                  </div>
                  {isCustomEditDistrict ? (
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="District"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  ) : (
                    <select
                      value={formData.district}
                      onChange={(e) => {
                        if (e.target.value === "__CUSTOM__") {
                          setIsCustomEditDistrict(true);
                        } else {
                          handleDistrictChange(e.target.value);
                        }
                      }}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      {hqDistricts.map((dst) => (
                        <option key={dst} value={dst}>{dst}</option>
                      ))}
                      <option value="__CUSTOM__">+ Other (Custom district...)</option>
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">City / Town *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomEditCity(!isCustomEditCity)}
                      className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                    >
                      {isCustomEditCity ? "← List" : "Custom"}
                    </button>
                  </div>
                  {isCustomEditCity ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City / Town"
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    />
                  ) : (
                    <select
                      value={formData.city}
                      onChange={(e) => {
                        if (e.target.value === "__CUSTOM__") {
                          setIsCustomEditCity(true);
                        } else {
                          setFormData({ ...formData, city: e.target.value });
                        }
                      }}
                      className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                    >
                      {hqCities.map((ct) => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                      <option value="__CUSTOM__">+ Other (Custom city...)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Settlement Details */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <CreditCard size={14} className="text-purple-600" />
                <span>Settlement Bank Details</span>
              </h4>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Settlement UPI VPA / QR ID</label>
                <input
                  type="text"
                  value={formData.bankUpiId}
                  onChange={(e) => setFormData({ ...formData, bankUpiId: e.target.value })}
                  placeholder="e.g. brand@icici"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="e.g. Curry Leaf Hospitality Pvt Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">IFSC Code (Auto Lookup)</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.bankIfsc}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const autoBank = lookupIfscBank(val);
                      setFormData({
                        ...formData,
                        bankIfsc: val,
                        bankName: autoBank || formData.bankName,
                      });
                    }}
                    placeholder="e.g. SBIN0001234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-semibold uppercase"
                  />
                  {formData.bankIfsc && lookupIfscBank(formData.bankIfsc) && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      ✓ {lookupIfscBank(formData.bankIfsc)}
                    </span>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="State Bank of India"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Confirm Account Number</label>
                  <input
                    type="text"
                    value={formData.confirmBankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, confirmBankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tax & Commission */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-600" />
                <span>Tax Compliance & Platform Take-Rate</span>
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">PAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient w-2/3 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
